import { eq } from 'drizzle-orm';
import { db } from '../../../db/index.js';
import { financeSettings, monthlyClosings, users, roles } from '../../../db/schema.js';

export async function getFinanceSettings() {
  const rows = await db.select().from(financeSettings).where(eq(financeSettings.id, 1)).limit(1);
  return rows[0] ?? null;
}

export async function updateOpeningBalance(openingBalance: string) {
  const rows = await db
    .update(financeSettings)
    .set({ openingBalance, updatedAt: new Date() })
    .where(eq(financeSettings.id, 1))
    .returning();
  return rows[0] ?? null;
}

// The opening balance only matters before the first period is closed; once any
// closing is `fechado`, its closing balance is snapshotted and the chain takes over.
export async function hasFechadoClosing(): Promise<boolean> {
  const rows = await db
    .select({ id: monthlyClosings.id })
    .from(monthlyClosings)
    .where(eq(monthlyClosings.status, 'fechado'))
    .limit(1);
  return rows.length > 0;
}

export async function getUserRoleName(userId: number): Promise<string | null> {
  const rows = await db
    .select({ name: roles.name })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0]?.name ?? null;
}
