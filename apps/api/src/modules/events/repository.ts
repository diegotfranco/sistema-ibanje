import { eq, ne, count, desc, and, type SQL } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { events } from '../../db/schema.js';

type EventInsert = Omit<typeof events.$inferInsert, 'id' | 'status' | 'createdAt' | 'updatedAt'>;
type EventUpdate = Partial<EventInsert>;

export async function listEvents(offset: number, limit: number, status?: 'ativo' | 'inativo') {
  const where: SQL | undefined = status ? eq(events.status, status) : ne(events.status, 'inativo');

  const rows = await db
    .select()
    .from(events)
    .where(where)
    .orderBy(desc(events.startTime))
    .offset(offset)
    .limit(limit);

  const countResult = await db.select({ count: count() }).from(events).where(where);

  return { rows, total: countResult[0]?.count ?? 0 };
}

export async function findEventById(id: number) {
  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result[0] ?? null;
}

export async function insertEvent(data: EventInsert) {
  const result = await db.insert(events).values(data).returning();
  return result[0] ?? null;
}

export async function updateEvent(id: number, data: EventUpdate) {
  const result = await db
    .update(events)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(events.id, id), ne(events.status, 'inativo')))
    .returning();
  return result[0] ?? null;
}

export async function deactivateEvent(id: number) {
  await db
    .update(events)
    .set({ status: 'inativo', updatedAt: new Date() })
    .where(eq(events.id, id));
}
