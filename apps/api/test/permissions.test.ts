import { describe, it, expect, beforeAll } from 'vitest';
import { hasPermission, assertPermission } from '../src/lib/permissions.js';
import { Module, Action } from '../src/lib/constants.js';
import { db } from '../src/db/index.js';
import { users } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

describe('permissions', () => {
  let adminId: number;
  let membroId: number;

  beforeAll(async () => {
    const admin = await db.select().from(users).where(eq(users.email, 'admin@email.com'));
    const membro = await db.select().from(users).where(eq(users.email, 'membro@email.com'));
    adminId = admin[0].id;
    membroId = membro[0].id;
  });

  it('admin has Cadastrar on Fechamentos Mensais', async () => {
    await expect(hasPermission(adminId, Module.MonthlyClosings, Action.Create)).resolves.toBe(true);
  });

  it('membro does not have Cadastrar on Fechamentos Mensais', async () => {
    await expect(hasPermission(membroId, Module.MonthlyClosings, Action.Create)).resolves.toBe(
      false
    );
  });

  it('assertPermission throws 403 when permission is missing', async () => {
    await expect(
      assertPermission(membroId, Module.MonthlyClosings, Action.Create)
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
