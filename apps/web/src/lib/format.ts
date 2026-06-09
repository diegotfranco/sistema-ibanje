// Display formatters: re-add the punctuation the backend strips before storage. Mirrors
// apps/api/src/lib/format.ts. Pure, total functions — if the value is empty or an unexpected
// length, they return the input unchanged so nothing ever renders as `undefined`. The same
// `mask*` logic backs the masked input components (PhoneInput/CnpjInput/CepInput).

const digits = (value: string | null | undefined): string => (value ?? '').replace(/\D/g, '');

/** `15556152000142` → `15.556.152/0001-42`. */
export function formatCnpj(value: string | null | undefined): string {
  const d = digits(value);
  if (d.length !== 14) return value ?? '';
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** `11999999999` → `(11) 99999-9999`; `1127414262` → `(11) 2741-4262`. */
export function formatPhone(value: string | null | undefined): string {
  const d = digits(value);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value ?? '';
}

/** `03446000` → `03446-000`. */
export function formatCep(value: string | null | undefined): string {
  const d = digits(value);
  if (d.length !== 8) return value ?? '';
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

// --- Partial masks for live input (format whatever digits are present so far) ---------------

/** Progressive CNPJ mask for an in-progress input value. */
export function maskCnpj(value: string): string {
  const d = digits(value).slice(0, 14);
  let out = d.slice(0, 2);
  if (d.length > 2) out += `.${d.slice(2, 5)}`;
  if (d.length > 5) out += `.${d.slice(5, 8)}`;
  if (d.length > 8) out += `/${d.slice(8, 12)}`;
  if (d.length > 12) out += `-${d.slice(12, 14)}`;
  return out;
}

/** Progressive BR phone mask (length-aware: 10-digit landline vs 11-digit mobile). */
export function maskPhone(value: string): string {
  const d = digits(value).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  const rest = d.slice(2);
  // Split point: 4 digits before the dash for landlines (≤10 total), 5 for mobiles (11).
  const split = d.length > 10 ? 5 : 4;
  if (rest.length <= split) return `(${d.slice(0, 2)}) ${rest}`;
  return `(${d.slice(0, 2)}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/** Progressive CEP mask for an in-progress input value. */
export function maskCep(value: string): string {
  const d = digits(value).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

/** Strips a masked display value back to raw digits (the wire value). */
export function toDigits(value: string): string {
  return digits(value);
}
