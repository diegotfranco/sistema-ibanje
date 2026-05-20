import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/pt-br';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.locale('pt-br');

export const APP_TZ = 'America/Sao_Paulo';
dayjs.tz.setDefault(APP_TZ);

type DateInput = string | number | Date | null | undefined;

const EMPTY = '—';

function parse(input: DateInput): dayjs.Dayjs | null {
  if (input === null || input === undefined || input === '') return null;
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return dayjs.tz(input, 'YYYY-MM-DD', APP_TZ);
  }
  const d = dayjs(input).tz(APP_TZ);
  return d.isValid() ? d : null;
}

export function formatDate(input: DateInput): string {
  const d = parse(input);
  return d ? d.format('DD/MM/YYYY') : EMPTY;
}

export function formatDateTime(input: DateInput): string {
  const d = parse(input);
  return d ? d.format('DD/MM/YYYY HH:mm') : EMPTY;
}

const MONTHS_LONG: Record<number, string> = {
  1: 'Janeiro',
  2: 'Fevereiro',
  3: 'Março',
  4: 'Abril',
  5: 'Maio',
  6: 'Junho',
  7: 'Julho',
  8: 'Agosto',
  9: 'Setembro',
  10: 'Outubro',
  11: 'Novembro',
  12: 'Dezembro'
};

const MONTHS_SHORT: Record<number, string> = {
  1: 'Jan',
  2: 'Fev',
  3: 'Mar',
  4: 'Abr',
  5: 'Mai',
  6: 'Jun',
  7: 'Jul',
  8: 'Ago',
  9: 'Set',
  10: 'Out',
  11: 'Nov',
  12: 'Dez'
};

export function formatMonthYear(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const num = Number.parseInt(month, 10);
  return `${MONTHS_LONG[num] ?? month}/${year}`;
}

export function formatMonthYearShort(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const num = Number.parseInt(month, 10);
  return `${MONTHS_SHORT[num] ?? month}/${year}`;
}

export function getCurrentMonth(): string {
  return dayjs().tz(APP_TZ).format('YYYY-MM');
}

export function nowInAppTz(): dayjs.Dayjs {
  return dayjs().tz(APP_TZ);
}

export function isDatePast(input: DateInput): boolean {
  const d = parse(input);
  if (!d) return false;
  return d.isBefore(nowInAppTz().startOf('day'));
}

export function isDateFuture(input: DateInput): boolean {
  const d = parse(input);
  if (!d) return false;
  return !d.isBefore(nowInAppTz().startOf('day'));
}
