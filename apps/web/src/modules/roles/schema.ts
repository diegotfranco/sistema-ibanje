import { z } from 'zod';

export const RoleFormSchema = z.object({
  name: z.string().min(2, 'Mínimo de 2 caracteres').max(64, 'Máximo de 64 caracteres'),
  description: z.string().max(256, 'Máximo de 256 caracteres').optional().or(z.literal(''))
});

export type RoleFormValues = z.infer<typeof RoleFormSchema>;

export type RoleResponse = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
};

export type RolePermissionEntry = {
  moduleId: number;
  moduleName: string;
  permissionId: number;
  permissionName: string;
};
