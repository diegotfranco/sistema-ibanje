// Read-only audit-trail types + label maps. The backend emits raw snake_case entity types and a
// small fixed action vocabulary; these maps turn them into pt-BR labels for the table and filters.

import { formatPhone, formatCep, formatCnpj, formatMoney } from '@/lib/format';

export type AuditChange = { from: unknown; to: unknown };

export interface AuditEntry {
  id: number;
  userId: number | null;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: number | null;
  notes: string | null;
  changes: Record<string, AuditChange> | null;
  ipAddress: string | null;
  createdAt: string;
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  create: 'Criação',
  update: 'Edição',
  delete: 'Exclusão',
  restore: 'Restauração',
  state_change: 'Atualizações'
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  user: 'Usuário',
  attender: 'Congregado',
  role: 'Cargo',
  income_entry: 'Lançamento de Entrada',
  expense_entry: 'Lançamento de Saída',
  monthly_closing: 'Fechamento Mensal',
  minute: 'Ata',
  minute_template: 'Modelo de Ata',
  membership_letter: 'Carta de Membro',
  church_settings: 'Dados da Igreja',
  finance_settings: 'Configurações Financeiras',
  meeting_attenders_present: 'Presença em Reunião'
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

export function auditEntityLabel(entityType: string): string {
  return AUDIT_ENTITY_LABELS[entityType] ?? entityType;
}

// pt-BR labels for the fields that show up in a `changes` diff. Keys are the response-DTO field
// names the backend diffs against; unknown keys fall back to the raw key.
export const AUDIT_FIELD_LABELS: Record<string, string> = {
  name: 'Nome',
  email: 'E-mail',
  phone: 'Telefone',
  status: 'Status',
  roleId: 'Cargo',
  isMember: 'Membro',
  admissionMode: 'Modo de Admissão',
  birthDate: 'Data de Nascimento',
  baptismDate: 'Data de Batismo',
  memberSince: 'Membro desde',
  congregatingSince: 'Congregando desde',
  exitDate: 'Data de Saída',
  exitReason: 'Motivo de Saída',
  exitLetterId: 'Carta de Transferência',
  addressStreet: 'Rua',
  addressNumber: 'Número',
  addressComplement: 'Complemento',
  addressDistrict: 'Bairro',
  // Attenders use `city`/`state`; church settings uses the `address*` prefix for the same fields.
  city: 'Cidade',
  state: 'Estado',
  addressCity: 'Cidade',
  addressState: 'Estado',
  postalCode: 'CEP',
  amount: 'Valor',
  depositDate: 'Data',
  referenceDate: 'Data de Referência',
  notes: 'Observações',
  description: 'Descrição',
  categoryId: 'Categoria',
  categoryName: 'Categoria',
  paymentMethodId: 'Forma de Pagamento',
  paymentMethodName: 'Forma de Pagamento',
  campaignId: 'Campanha',
  campaignName: 'Campanha',
  eventId: 'Evento',
  eventName: 'Evento',
  attenderId: 'Congregado',
  attenderName: 'Congregado',
  logoPath: 'Logotipo',
  openingBalance: 'Saldo Inicial',
  openingBalanceDate: 'Data do Saldo Inicial',
  cnpj: 'CNPJ',
  websiteUrl: 'Site',
  currentPresidentName: 'Presidente',
  currentSecretaryName: 'Secretário(a)'
};

export function auditFieldLabel(field: string): string {
  return AUDIT_FIELD_LABELS[field] ?? field;
}

// Field-aware display formatters for diff values: the backend stores raw digits (phone/CNPJ/CEP) and
// numeric strings (money), so re-add the punctuation here exactly as the rest of the app does. Keyed
// by the response-DTO field name; absent keys fall through to the plain stringifier below.
const AUDIT_VALUE_FORMATTERS: Record<string, (v: string) => string> = {
  phone: formatPhone,
  postalCode: formatCep,
  cnpj: formatCnpj,
  amount: formatMoney,
  openingBalance: formatMoney
};

// Render a diff value for display: nullish/empty → "—", booleans → Sim/Não, field-typed values
// (phone/CNPJ/CEP/money) get their mask, everything else is stringified.
export function formatAuditValue(value: unknown, field?: string): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  const formatter = field ? AUDIT_VALUE_FORMATTERS[field] : undefined;
  if (formatter) return formatter(String(value));
  return String(value);
}

// Presentation filter for a changes map: drop a raw `<base>Id` entry when its resolved
// `<base>Name` is also present (the friendly name carries the same change), so the dialog shows
// "Forma de Pagamento: Dinheiro → Cartão" once instead of also listing the raw FK id.
export function visibleAuditChanges(changes: Record<string, AuditChange>): [string, AuditChange][] {
  return Object.entries(changes).filter(([key]) => {
    if (key.endsWith('Id')) {
      const nameKey = `${key.slice(0, -2)}Name`;
      if (nameKey in changes) return false;
    }
    return true;
  });
}

// Filter option lists (value = raw backend token, label = pt-BR).
export const AUDIT_ACTION_OPTIONS = Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({
  value,
  label
}));

export const AUDIT_ENTITY_OPTIONS = Object.entries(AUDIT_ENTITY_LABELS).map(([value, label]) => ({
  value,
  label
}));
