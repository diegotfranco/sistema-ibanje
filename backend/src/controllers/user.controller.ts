import { Request, Response } from 'express';
import asyncHandler from '@/utils/asyncHandler';
import { makeUserService } from '@/services/user.service';
import { userRepository } from '@/repositories/user.repository';
import { roleRepository } from '@/repositories/role.repository';
import { permissionRepository } from '@/repositories/permission.repository';
import { Errors } from '@/utils/errorFactory';
import { userCreateDTO, userUpdateDTO } from '@/dtos/user.dto';

const userService = makeUserService(userRepository, roleRepository, permissionRepository);

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const result = await userService.getAll();
  res.status(200).json(result);
});

export const getId = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) throw Errors.badRequest('Formato dos dados inválido');

  const result = await userService.getById(id);
  res.status(200).json(result);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const parsed = userCreateDTO.safeParse(req.body);
  if (!parsed.success) throw Errors.badRequest('Formato dos dados inválido');

  const result = await userService.create(parsed.data);
  res.status(201).json(result);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const parsed = userUpdateDTO.safeParse(req.body);

  if (!id || !parsed.success) throw Errors.badRequest('Formato dos dados inválido');

  const result = await userService.update(id, parsed.data);
  res.status(200).json(result);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) throw Errors.badRequest('Formato dos dados inválido');

  const result = await userService.delete(id);
  res.status(200).json(result);
});
