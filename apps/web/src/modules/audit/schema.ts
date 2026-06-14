// Read-only audit-trail types + label maps. The backend emits raw snake_case entity types and a
// small fixed action vocabulary; these maps turn them into pt-BR labels for the table and filters.

export interface AuditEntry {
  id: number;
  userId: number | null;
  userName: string | null;
  action: string;
  entityType: string;
  entityId: number | null;
  notes: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  create: 'Criação',
  update: 'Edição',
  delete: 'Exclusão',
  restore: 'Restauração',
  state_change: 'Mudança de estado'
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

// Filter option lists (value = raw backend token, label = pt-BR).
export const AUDIT_ACTION_OPTIONS = Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({
  value,
  label
}));

export const AUDIT_ENTITY_OPTIONS = Object.entries(AUDIT_ENTITY_LABELS).map(([value, label]) => ({
  value,
  label
}));
