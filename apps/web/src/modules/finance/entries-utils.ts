import { EntryStatus } from '@sistema-ibanje/shared';

export { formatDate } from '@/lib/datetime';

export const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: EntryStatus.Pending, label: 'Pendente' },
  { value: EntryStatus.Paid, label: 'Paga' },
  { value: EntryStatus.Cancelled, label: 'Cancelada' }
] as const;

// Options for a column's `meta.filter` (no `all` sentinel — DataTable's header
// filter menu adds the "Todos" entry itself, mapping it to `undefined`).
export const ENTRY_STATUS_FILTER_OPTIONS = [
  { value: EntryStatus.Pending, label: 'Pendente' },
  { value: EntryStatus.Paid, label: 'Paga' },
  { value: EntryStatus.Cancelled, label: 'Cancelada' }
];

export const formatMoney = (s: string) =>
  Number.parseFloat(s).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

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
