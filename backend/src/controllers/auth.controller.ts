import type { Request, Response } from 'express';
import { userRepository } from '@/repositories/user.repository';
import asyncHandler from '@/utils/asyncHandler';
import { makeAuthService } from '@/services/auth.service';
import { roleRepository } from '@/repositories/role.repository';
import { permissionRepository } from '@/repositories/permission.repository';
import { Errors } from '@/utils/errorFactory';
import { authLoginDTO, authSignUpDTO, authForgotPasswordDTO, authResetPasswordDTO } from '@/dtos/auth.dto';

const service = makeAuthService(userRepository, roleRepository, permissionRepository);

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const parsed = authLoginDTO.safeParse(req.body);
  if (!parsed.success) throw Errors.badRequest('Formato dos dados inválido');

  const result = await service.login(parsed.data);
  req.session.user = result;

  const safeResult = {
    email: result.email,
    name: result.name,
    role_name: result.role,
    role: result.role_id,
    permissions: result.permissions
  };

  res.status(200).json(safeResult);
});

export const signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const parsed = authSignUpDTO.safeParse(req.body);
  if (!parsed.success) throw Errors.badRequest('Formato dos dados inválido');

  const result = await service.signup(parsed.data);
  res.status(201).json(result);
});

export const getSessionUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await service.getSessionUser(req.session);
  if (!result) throw Errors.unauthorized('Sessão expirada');

  const safeResult = {
    email: result.email,
    name: result.name,
    role_name: result.role,
    role: result.role_id,
    permissions: result.permissions
  };

  res.status(200).json(safeResult);
});

export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await service.logout(req.session);
  res.clearCookie('sid', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  res.sendStatus(200);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const parsed = authForgotPasswordDTO.safeParse(req.body);
  if (!parsed.success) throw Errors.badRequest('Formato dos dados inválido');

  const { email } = parsed.data;
  const ip = req.ip;
  const userAgent = req.get('User-Agent');

  await service.requestPasswordReset(email, ip, userAgent);
  res.status(200).json({
    message: 'Foi encaminhado um e-mail com instruções para redefinir a senha.'
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const parsed = authResetPasswordDTO.safeParse(req.body);
  if (!parsed.success) throw Errors.badRequest('Formato dos dados inválido');

  const { token, password } = parsed.data;

  await service.updatePassword(token, password);
  res.json({ msg: 'Senha redefinida com sucesso' });
});
