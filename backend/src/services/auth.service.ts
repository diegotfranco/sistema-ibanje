import crypto from 'crypto';
import { hashPassword, needsRehash, verifyPassword } from '@/utils/auth';
import { Errors } from '@/utils/errorFactory';
import { makeUserService } from '@/services/user.service';
import type { Session } from 'express-session';
import type { UserRepository } from '@/repositories/user.repository';
import type { RoleRepository } from '@/repositories/role.repository';
import type { PermissionRepository } from '@/repositories/permission.repository';
import { passwordResetRepository } from '@/repositories/passwordReset.repository';
import { sendPasswordResetEmail } from '@/utils/mailer';
import groupPermissions from '@/utils/groupPermissions';
import { status } from '@/enums/status.enum';
import { AuthLoginDTO, AuthSignUpDTO } from '@/dtos/auth.dto';

const RESET_TTL = Number(process.env.RESET_TOKEN_TTL_SECONDS ?? 900); // 15 min
const RATE_WINDOW = Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_WINDOW ?? 3600); // 1h
const RATE_MAX = Number(process.env.FORGOT_PASSWORD_RATE_LIMIT_MAX ?? 5);

export const makeAuthService = (
  userRepo: UserRepository,
  roleRepo: RoleRepository,
  permissionRepo: PermissionRepository
) => {
  const userService = makeUserService(userRepo, roleRepo, permissionRepo);
  return {
    async login({ email, password }: AuthLoginDTO) {
      let role: string | undefined;

      const user = await userRepo.findByEmail(email.trim().toLowerCase());
      if (!user) throw Errors.unauthorized('Email ou senha inválido');

      const isValid = await verifyPassword(password, user.password_hash);
      if (!isValid) throw Errors.unauthorized('Email ou senha inválido');

      // Rehash if params changed (non-blocking update)
      if (needsRehash(user.password_hash)) {
        const newHash = await hashPassword(password);
        userRepo.updatePassword(user.id, newHash).catch((err) => {
          console.error('Failed to update password hash:', err);
        });
      }

      if (user.role_id) role = (await roleRepo.findById(user.role_id))?.name;
      const permissions = await permissionRepo.findByUserId(user.id);

      const { name, password_hash, ...safeUser } = user; // don’t leak hash

      return {
        ...safeUser,
        name,
        role,
        permissions: groupPermissions(permissions)
      };
    },

    async signup(data: AuthSignUpDTO) {
      const result = await userService.create(data, 'pendente');

      return result;
    },

    /** Get the current logged-in user from the session */
    async getSessionUser(session: Session) {
      if (!session.user) throw Errors.unauthorized('Sessão expirada');
      return session.user;
    },

    /** Destroy the current session */
    async logout(session: Session) {
      return new Promise<void>((resolve, reject) => {
        session.destroy((err) => (err ? reject(Errors.internal('Falha ao encerrar sessão')) : resolve()));
      });
    },

    async updatePassword(token: string, newPassword: string): Promise<void> {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const record = await passwordResetRepository.findValidByHash(tokenHash);
      if (!record || new Date(record.expires_at) < new Date()) {
        throw Errors.unauthorized('Token inválido ou expirado');
      }

      const user = await userRepo.findByEmail(record.email);
      if (!user) throw Errors.notFound('Usuário não encontrado');

      const password_hash = await hashPassword(newPassword);
      await userRepo.updatePassword(user.id, password_hash);

      // Cleanup: delete used token
      await passwordResetRepository.markUsed(record.id);
    },

    /** Handle forgot password requests */
    async requestPasswordReset(email: string, ip?: string, userAgent?: string) {
      const user = await userRepo.findByEmail(email.trim().toLowerCase());
      if (!user) throw Errors.notFound('Email não cadastrado');

      // Rate limit per email
      const recentCount = await passwordResetRepository.countRecentByEmail(user.email, RATE_WINDOW);
      if (recentCount >= RATE_MAX) {
        return { sent: false, reason: 'rate_limited' };
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + RESET_TTL * 1000).toISOString();

      await passwordResetRepository.insert({
        userId: user.id,
        email: user.email,
        tokenHash,
        expiresAt,
        ip,
        userAgent
      });

      const frontendBase = process.env.FRONTEND_BASE_URL?.replace(/\/$/, '');
      const resetUrl = `${frontendBase}/redefinir-senha?token=${encodeURIComponent(rawToken)}`;

      try {
        await sendPasswordResetEmail(user.email, resetUrl, RESET_TTL);
        return { sent: true };
      } catch (err) {
        console.error('Failed to send reset email', err);
        return { sent: false, reason: 'mailer_failed' };
      }
    }
  };
};
