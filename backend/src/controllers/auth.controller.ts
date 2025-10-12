import type { Request, Response } from 'express';
import { userRepository } from '@/repositories/user.repository';
import asyncHandler from '@/utils/asyncHandler';
import { makeAuthService } from '@/services/auth.service';
import { roleRepository } from '@/repositories/role.repository';
import { permissionRepository } from '@/repositories/permission.repository';
import { Errors } from '@/utils/errorFactory';
import { authLoginDTO } from '@/dtos/auth.dto';

const service = makeAuthService(userRepository, roleRepository, permissionRepository);

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const parsed = authLoginDTO.safeParse(req.body);
  if (!parsed.success) throw Errors.badRequest('Formato das credenciais inválido');

  const { email, password } = parsed.data;

  const user = await service.login(email, password);

  req.session.user = user;

  res.status(200).json(user);
});

export const getSession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await service.getSessionUser(req.session);
  if (!user) throw Errors.unauthorized('Sessão expirada');

  res.status(200).json(user);
});

export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await service.logout(req.session);
  res.clearCookie('sid', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  res.status(200).json({ msg: 'ok' });
});
