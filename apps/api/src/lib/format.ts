// Display formatters: re-add the punctuation that `lib/normalize.ts` strips before storage.
// Pure, total functions — if the stored value is `null`/`''` or an unexpected length (legacy
// rows that escaped normalization), they pass the input through unchanged rather than throwing,
// so a document still renders. The web app mirrors these in `apps/web/src/lib/format.ts`.

/** `15556152000142` → `15.556.152/0001-42`. */
export function formatCnpj(value: string | null | undefined): string {
  const d = (value ?? '').replace(/\D/g, '');
  if (d.length !== 14) return value ?? '';
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** `11999999999` → `(11) 99999-9999`; `1127414262` → `(11) 2741-4262`. */
export function formatPhone(value: string | null | undefined): string {
  const d = (value ?? '').replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value ?? '';
}

/** `03446000` → `03446-000`. */
export function formatCep(value: string | null | undefined): string {
  const d = (value ?? '').replace(/\D/g, '');
  if (d.length !== 8) return value ?? '';
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}
