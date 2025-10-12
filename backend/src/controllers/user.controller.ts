import { Request, Response } from 'express';
import asyncHandler from '@/utils/asyncHandler';
import { makeUserService } from '@/services/user.service';
import { userRepository } from '@/repositories/user.repository';
import { roleRepository } from '@/repositories/role.repository';
import { permissionRepository } from '@/repositories/permission.repository';

const userService = makeUserService(userRepository, roleRepository, permissionRepository);

export const getAll = asyncHandler(async (_req: Request, res: Response) => {
  const users = await userService.getAll();
  res.status(200).json(users);
});

export const getId = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = await userService.getById(id);
  res.status(200).json(user);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.create(req.body);
  res.status(201).json(user);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = await userService.update(id, req.body);
  res.status(200).json(user);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await userService.delete(id);
  res.status(200).json(result);
});
