import { findMonthlyClosingByPeriod } from '../modules/finance/monthly-closings/repository.js';
import { httpError } from './errors.js';

export async function assertPeriodEditable(referenceDate: string): Promise<void> {
  const year = Number.parseInt(referenceDate.substring(0, 4));
  const month = Number.parseInt(referenceDate.substring(5, 7));

  const closing = await findMonthlyClosingByPeriod(year, month);
  if (closing && closing.status !== 'aberto') {
    throw httpError(409, 'This period is locked for editing');
  }
}
