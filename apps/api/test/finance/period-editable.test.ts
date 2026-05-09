import { describe, it, expect, beforeAll } from 'vitest';
import { assertPeriodEditable } from '../../src/lib/finance.js';
import { db } from '../../src/db/index.js';
import { monthlyClosings } from '../../src/db/schema.js';
import { reseedDb } from '../helpers/db.js';

describe('assertPeriodEditable', () => {
  beforeAll(() => {
    reseedDb();
  });

  it('passes when no closing exists for the period', async () => {
    await expect(assertPeriodEditable('2099-01-15')).resolves.toBeUndefined();
  });

  it('passes when closing for the period is aberto', async () => {
    await db.insert(monthlyClosings).values({
      periodYear: 2099,
      periodMonth: 2,
      status: 'aberto'
    });
    await expect(assertPeriodEditable('2099-02-10')).resolves.toBeUndefined();
  });

  it('throws 409 when the closing is not aberto', async () => {
    await db.insert(monthlyClosings).values({
      periodYear: 2099,
      periodMonth: 3,
      status: 'em revisão'
    });
    await expect(assertPeriodEditable('2099-03-10')).rejects.toMatchObject({ statusCode: 409 });
  });
});
