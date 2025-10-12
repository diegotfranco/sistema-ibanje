import groupPermissions from '@/utils/groupPermissions';
import { Errors } from '@/utils/errorFactory';
import type { PermissionRepository } from '@/repositories/permission.repository';
import type { RoleRepository } from '@/repositories/role.repository';
import type { UserRepository } from '@/repositories/user.repository';
import type { UserCreateDTO, UserUpdateDTO } from '@/dtos/user.dto';
import { UserEntity } from '@/entities/user.entity';
import { generateHash } from '@/utils/auth';

export const makeUserService = (
  userRepo: UserRepository,
  roleRepo: RoleRepository,
  permissionRepo: PermissionRepository
) => ({
  async getAll() {
    const users = await userRepo.findAll();
    if (!users?.length) throw Errors.notFound('Nenhum usuário encontrado');
    return users;
  },

  async getById(id: number) {
    const user = await userRepo.findById(id);
    if (!user) throw Errors.notFound('Usuário não encontrado');

    const role = await roleRepo.findById(user.id_cargo);
    const permissions = await permissionRepo.findByUserId(user.id);

    return {
      ...user,
      role: role?.nome,
      permissions: groupPermissions(permissions)
    };
  },

  async create(data: UserCreateDTO) {
    const existing = await userRepo.findByEmail(data.email);
    if (existing) throw Errors.conflict('Usuário já existe');

    const hash = generateHash(data.password);
    const user = await userRepo.create({ ...data, hash });

    return UserEntity.parse(user);
  },

  async update(id: number, data: UserUpdateDTO) {
    if (!data || Object.keys(data).length === 0) throw Errors.badRequest('Sem dados a serem atualizados');

    const updated = await userRepo.update(id, {
      ...data,
      ...(data.password ? { hash: generateHash(data.password) } : {})
    });

    if (!updated) throw Errors.notFound('Usuário não encontrado');
    return UserEntity.parse(updated);
  },

  async delete(id: number) {
    const deleted = await userRepo.delete(id);
    if (!deleted) throw Errors.notFound('Usuário não encontrado');
    return { message: 'Usuário deletado com sucesso' };
  }
});
