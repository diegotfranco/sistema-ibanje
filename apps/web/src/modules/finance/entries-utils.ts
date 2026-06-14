export { formatDate } from '@/lib/datetime';

// Entry-status filter options live in the central status module (lib/status.ts). Re-exported here
// so finance call sites that already import from entries-utils don't need a second import path.
export { ENTRY_STATUS_FILTER_OPTIONS } from '@/lib/status';

// Bare number (no `R$`); call sites prepend `R$ ` themselves. Backed by the shared formatter.
export { formatAmount as formatMoney } from '@/lib/format';

const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

// Full calendar month [01 → last day] for the current month. We deliberately span the *whole*
// month (not up to today): income is filtered by its reference Sunday, which can fall later this
// week than today, so a today-cap would hide freshly recorded contributions. A monthly total is a
// whole-month figure anyway.
export function currentMonthRange(): { from: string; to: string; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(year, month + 1, 0).getDate();
  const from = `${year}-${pad(month + 1)}-01`;
  const to = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
  return { from, to, label: `${MONTHS_PT[month]}/${year}` };
}

export function makeSubmitHandler<TValues, TItem extends { id: number }>(
  editing: TItem | null | 'new',
  setEditing: (v: TItem | null | 'new') => void,
  create: { mutate: (values: TValues, opts: { onSuccess: () => void }) => void },
  update: { mutate: (args: { id: number; body: TValues }, opts: { onSuccess: () => void }) => void }
): (values: TValues) => void {
  return (values) => {
    if (editing === 'new') {
      create.mutate(values, { onSuccess: () => setEditing(null) });
    } else if (editing !== null) {
      update.mutate({ id: editing.id, body: values }, { onSuccess: () => setEditing(null) });
    }
  };
}
