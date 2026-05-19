import {
  findMonthlyClosingByPeriod,
  findLatestNonAbertoClosing
} from '../modules/finance/monthly-closings/repository.js';
import { httpError } from './errors.js';

export async function assertPeriodEditable(referenceDate: string): Promise<void> {
  const year = Number.parseInt(referenceDate.substring(0, 4));
  const month = Number.parseInt(referenceDate.substring(5, 7));

  const closing = await findMonthlyClosingByPeriod(year, month);
  if (closing && closing.status !== 'aberto') {
    throw httpError(409, 'This period is locked for editing');
  }

  const latest = await findLatestNonAbertoClosing();
  if (latest) {
    let maxAllowedMonth = latest.periodMonth + 1;
    let maxAllowedYear = latest.periodYear;

    if (maxAllowedMonth > 12) {
      maxAllowedMonth = 1;
      maxAllowedYear += 1;
    }

    const isAfterMax =
      year > maxAllowedYear || (year === maxAllowedYear && month > maxAllowedMonth);
    if (isAfterMax) {
      const latestStr = `${String(latest.periodMonth).padStart(2, '0')}/${latest.periodYear}`;
      throw httpError(
        409,
        `Não é permitido lançar para um período mais de um mês à frente do último fechamento (último: ${latestStr}).`
      );
    }
  }
}
