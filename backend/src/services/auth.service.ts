import groupPermissions from '@/utils/groupPermissions';
import { validPassword } from '@/utils/auth';
import { Errors } from '@/utils/errorFactory';
import type { Session } from 'express-session';
import type { UserRepository } from '@/repositories/user.repository';
import type { RoleRepository } from '@/repositories/role.repository';
import type { PermissionRepository } from '@/repositories/permission.repository';

export const makeAuthService = (
  userRepo: UserRepository,
  roleRepo: RoleRepository,
  permissionRepo: PermissionRepository
) => ({
  async login(email: string, password: string) {
    if (!email || !password) throw Errors.badRequest('Email e senha são obrigatórios');

    const user = await userRepo.findByEmail(email);
    if (!user || !validPassword(password, user.hash)) throw Errors.unauthorized('Credenciais inválidas');

    const role = await roleRepo.findById(user.id_cargo);
    const permissions = await permissionRepo.findByUserId(user.id);
    const { nome, ...rest } = user;

    return {
      ...rest,
      name: nome,
      role: role?.nome,
      permissions: groupPermissions(permissions)
    };
  },

  async getSessionUser(session: Session) {
    if (!session.user) throw Errors.unauthorized('Sessão expirada');
    return session.user;
  },

  async logout(session: Session) {
    return new Promise<void>((resolve, reject) => {
      session.destroy((err) => (err ? reject(Errors.internal(err.message)) : resolve()));
    });
  }
});
