export { formatDate } from '@/lib/datetime';

// Entry-status filter options live in the central status module (lib/status.ts). Re-exported here
// so finance call sites that already import from entries-utils don't need a second import path.
export { ENTRY_STATUS_FILTER_OPTIONS } from '@/lib/status';

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
