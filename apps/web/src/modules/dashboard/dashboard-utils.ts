/**
 * Format date string (YYYY-MM-DD) to DD/MM/YYYY
 */
export const formatDate = (dateString: string): string => {
  const [y, m, d] = dateString.split('-');
  return `${d}/${m}/${y}`;
};

/**
 * Format money string to Brazilian format
 */
export const formatMoney = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Get current month as YYYY-MM
 */
export const getCurrentMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Portuguese month names (abbreviated and full)
 */
const monthNames = {
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

const monthNamesAbbrv = {
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

/**
 * Format YYYY-MM to Portuguese month name, e.g., "Maio/2026"
 */
export const formatMonthYear = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const monthNum = parseInt(month, 10);
  const monthName = monthNames[monthNum as keyof typeof monthNames] || month;
  return `${monthName}/${year}`;
};

/**
 * Format YYYY-MM to abbreviated Portuguese, e.g., "Mai/2026"
 */
export const formatMonthYearShort = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const monthNum = parseInt(month, 10);
  const monthAbbr = monthNamesAbbrv[monthNum as keyof typeof monthNamesAbbrv] || month;
  return `${monthAbbr}/${year}`;
};

/**
 * Extract month number (1-12) from YYYY-MM
 */
export const getMonthNumber = (monthStr: string): number => {
  const [, month] = monthStr.split('-');
  return parseInt(month, 10);
};

/**
 * Extract year from YYYY-MM
 */
export const getYear = (monthStr: string): number => {
  const [year] = monthStr.split('-');
  return parseInt(year, 10);
};

/**
 * Determine if a closing is past-due (before current month and not closed)
 */
export const isPastClosing = (year: number, month: number, currentMonth: string): boolean => {
  const [currentYear, currentMonthStr] = currentMonth.split('-');
  const currentMonthNum = parseInt(currentMonthStr, 10);
  const currentYearNum = parseInt(currentYear, 10);

  if (year < currentYearNum) return true;
  if (year === currentYearNum && month < currentMonthNum) return true;
  return false;
};

/**
 * Format YYYY-MM as Mês/Ano for banners
 */
export const formatMonthForBanner = (monthStr: string): string => {
  return formatMonthYear(monthStr);
};

/**
 * Check if a date string (YYYY-MM-DD) is in the past relative to today
 */
export const isDatePast = (dateStr: string | null): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

/**
 * Check if a date string (YYYY-MM-DD) is today or in the future
 */
export const isDateFuture = (dateStr: string | null): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};
