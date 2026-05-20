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

  describe('forward-month limit (non-aberto closings)', () => {
    it('allows entries up to one month after the latest non-aberto closing', async () => {
      await db.insert(monthlyClosings).values({
        periodYear: 2100,
        periodMonth: 4,
        status: 'fechado'
      });
      // Latest non-aberto is April 2100, so May is allowed
      await expect(assertPeriodEditable('2100-05-10')).resolves.toBeUndefined();
    });

    it('blocks entries more than one month after the latest non-aberto closing', async () => {
      await db.insert(monthlyClosings).values({
        periodYear: 2101,
        periodMonth: 5,
        status: 'fechado'
      });
      // Latest non-aberto is May 2101, so June is allowed but July is blocked
      await expect(assertPeriodEditable('2101-07-10')).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('05/2101')
      });
    });

    it('allows entries within the +1 month window when multiple non-aberto closings exist', async () => {
      await db.insert(monthlyClosings).values([
        {
          periodYear: 2102,
          periodMonth: 6,
          status: 'fechado'
        },
        {
          periodYear: 2102,
          periodMonth: 7,
          status: 'em revisão'
        }
      ]);
      // Latest non-aberto is July 2102, so August is allowed
      await expect(assertPeriodEditable('2102-08-10')).resolves.toBeUndefined();
    });

    it('blocks entries beyond +1 month when multiple non-aberto closings exist', async () => {
      await db.insert(monthlyClosings).values([
        {
          periodYear: 2103,
          periodMonth: 8,
          status: 'fechado'
        },
        {
          periodYear: 2103,
          periodMonth: 9,
          status: 'em revisão'
        }
      ]);
      // Latest non-aberto is September 2103, so October is allowed but November is blocked
      await expect(assertPeriodEditable('2103-11-10')).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('09/2103')
      });
    });

    it('handles December to January wrap correctly', async () => {
      await db.insert(monthlyClosings).values({
        periodYear: 2104,
        periodMonth: 12,
        status: 'em revisão'
      });
      // Latest non-aberto is December 2104, so January 2105 is allowed
      await expect(assertPeriodEditable('2105-01-15')).resolves.toBeUndefined();
      // But February 2105 should be blocked
      await expect(assertPeriodEditable('2105-02-10')).rejects.toMatchObject({
        statusCode: 409,
        message: expect.stringContaining('12/2104')
      });
    });
  });
});
