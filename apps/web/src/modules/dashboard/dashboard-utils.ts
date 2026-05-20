import { formatMonthYear } from '@/lib/datetime';

export {
  formatDate,
  formatMonthYear,
  formatMonthYearShort,
  getCurrentMonth,
  isDatePast,
  isDateFuture
} from '@/lib/datetime';

export const formatMonthForBanner = (monthStr: string): string => formatMonthYear(monthStr);

export const formatMoney = (value: string | number): string => {
  const num = typeof value === 'string' ? Number.parseFloat(value) : value;
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const getMonthNumber = (monthStr: string): number => {
  const [, month] = monthStr.split('-');
  return Number.parseInt(month, 10);
};

export const getYear = (monthStr: string): number => {
  const [year] = monthStr.split('-');
  return Number.parseInt(year, 10);
};

export const isPastClosing = (year: number, month: number, currentMonth: string): boolean => {
  const [currentYear, currentMonthStr] = currentMonth.split('-');
  const currentMonthNum = Number.parseInt(currentMonthStr, 10);
  const currentYearNum = Number.parseInt(currentYear, 10);

  if (year < currentYearNum) return true;
  if (year === currentYearNum && month < currentMonthNum) return true;
  return false;
};
