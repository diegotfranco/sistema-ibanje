import {
  ActiveStatus,
  type ActiveStatusValue,
  EntryStatus,
  type EntryStatusValue,
  ClosingStatus,
  type ClosingStatusValue,
  MinuteStatus,
  type MinuteStatusValue,
  AttenderStatus,
  type AttenderStatusValue,
  ATTENDER_TERMINAL_STATUSES,
  CampaignStatus,
  type CampaignStatusValue
} from '@sistema-ibanje/shared';

// Single source of truth for status presentation (labels + badge colors + filter options) and
// the member-lifecycle FSM mirror. StatusBadge and every status filter dropdown consume from here,
// so a label/color lives in exactly one place. Introduced by the status/soft-delete overhaul.

// ---------------------------------------------------------------------------
// Soft-delete list slice — mirrors the backend `DeletedFilter` (lib/softDelete.ts).
// `'only'` powers a "Lixeira" (trash) view; `'include'` returns live + deleted.
// ---------------------------------------------------------------------------
export type DeletedFilter = 'only' | 'include';

// ---------------------------------------------------------------------------
// Singular labels (badge text)
// ---------------------------------------------------------------------------
export const ACTIVE_STATUS_LABELS: Record<ActiveStatusValue, string> = {
  [ActiveStatus.Active]: 'Ativo',
  [ActiveStatus.Inactive]: 'Inativo',
  [ActiveStatus.Pending]: 'Pendente'
};

export const ENTRY_STATUS_LABELS: Record<EntryStatusValue, string> = {
  [EntryStatus.Pending]: 'Pendente',
  [EntryStatus.Paid]: 'Paga',
  [EntryStatus.Cancelled]: 'Cancelada'
};

export const CLOSING_STATUS_LABELS: Record<ClosingStatusValue, string> = {
  [ClosingStatus.Open]: 'Aberto',
  [ClosingStatus.InReview]: 'Em revisão',
  [ClosingStatus.Rejected]: 'Rejeitado',
  [ClosingStatus.Approved]: 'Aprovado',
  [ClosingStatus.Closed]: 'Fechado'
};

export const MINUTE_STATUS_LABELS: Record<MinuteStatusValue, string> = {
  [MinuteStatus.Draft]: 'Rascunho',
  [MinuteStatus.AwaitingApproval]: 'Aguardando aprovação',
  [MinuteStatus.Approved]: 'Aprovada',
  [MinuteStatus.Replaced]: 'Substituída'
};

export const ATTENDER_STATUS_LABELS: Record<AttenderStatusValue, string> = {
  [AttenderStatus.Active]: 'Ativo',
  [AttenderStatus.Inactive]: 'Inativo',
  [AttenderStatus.Dismissed]: 'Desligado',
  [AttenderStatus.Transferred]: 'Transferido',
  [AttenderStatus.Deceased]: 'Falecido'
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatusValue, string> = {
  [CampaignStatus.Active]: 'Ativa',
  [CampaignStatus.Ended]: 'Encerrada'
};

// Merged singular labels for the generic badge lookup. Keys overlap (ativo/inativo appear in both
// ActiveStatus and AttenderStatus) but resolve to the same text, so the spread order is irrelevant.
const STATUS_LABELS: Record<string, string> = {
  ...ACTIVE_STATUS_LABELS,
  ...ENTRY_STATUS_LABELS,
  ...CLOSING_STATUS_LABELS,
  ...MINUTE_STATUS_LABELS,
  ...ATTENDER_STATUS_LABELS,
  ...CAMPAIGN_STATUS_LABELS
};

// Label for any known status value, falling back to capitalize-first for unknowns.
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
}

// ---------------------------------------------------------------------------
// Badge colors
// ---------------------------------------------------------------------------
const ACTIVE_STATUS_CLASSES: Record<ActiveStatusValue, string> = {
  [ActiveStatus.Active]: 'bg-success/15 text-success',
  [ActiveStatus.Inactive]: 'bg-muted text-muted-foreground',
  [ActiveStatus.Pending]: 'bg-warning/15 text-warning'
};

const ENTRY_STATUS_CLASSES: Record<EntryStatusValue, string> = {
  [EntryStatus.Pending]: 'bg-warning/15 text-warning',
  [EntryStatus.Paid]: 'bg-success/15 text-success',
  [EntryStatus.Cancelled]: 'bg-muted text-muted-foreground'
};

const CLOSING_STATUS_CLASSES: Record<ClosingStatusValue, string> = {
  [ClosingStatus.Open]: 'bg-primary-soft/15 text-primary-soft',
  [ClosingStatus.InReview]: 'bg-warning/15 text-warning',
  [ClosingStatus.Rejected]: 'bg-danger/15 text-danger',
  [ClosingStatus.Approved]: 'bg-success/15 text-success',
  [ClosingStatus.Closed]: 'bg-muted text-muted-foreground'
};

const MINUTE_STATUS_CLASSES: Record<MinuteStatusValue, string> = {
  [MinuteStatus.Draft]: 'bg-primary-soft/15 text-primary-soft',
  [MinuteStatus.AwaitingApproval]: 'bg-warning/15 text-warning',
  [MinuteStatus.Approved]: 'bg-success/15 text-success',
  [MinuteStatus.Replaced]: 'bg-muted text-muted-foreground'
};

// ativo/inativo overlap with ActiveStatus (resolved first in getStatusClass); only the formal-exit
// states need their own colors here.
const ATTENDER_STATUS_CLASSES: Partial<Record<AttenderStatusValue, string>> = {
  [AttenderStatus.Dismissed]: 'bg-danger/15 text-danger',
  [AttenderStatus.Transferred]: 'bg-primary-soft/15 text-primary-soft',
  [AttenderStatus.Deceased]: 'bg-muted text-muted-foreground'
};

const CAMPAIGN_STATUS_CLASSES: Record<CampaignStatusValue, string> = {
  [CampaignStatus.Active]: 'bg-success/15 text-success',
  [CampaignStatus.Ended]: 'bg-muted text-muted-foreground'
};

// Resolution order matters: ativo/inativo belong to both ActiveStatus and AttenderStatus, and we
// want the shared availability colors for those, reserving ATTENDER_STATUS_CLASSES for the
// formal-exit states (desligado/transferido/falecido).
export function getStatusClass(status: string): string {
  if (Object.values(ActiveStatus).includes(status as ActiveStatusValue)) {
    return ACTIVE_STATUS_CLASSES[status as ActiveStatusValue] ?? '';
  }
  if (Object.values(EntryStatus).includes(status as EntryStatusValue)) {
    return ENTRY_STATUS_CLASSES[status as EntryStatusValue] ?? '';
  }
  if (Object.values(ClosingStatus).includes(status as ClosingStatusValue)) {
    return CLOSING_STATUS_CLASSES[status as ClosingStatusValue] ?? '';
  }
  if (Object.values(MinuteStatus).includes(status as MinuteStatusValue)) {
    return MINUTE_STATUS_CLASSES[status as MinuteStatusValue] ?? '';
  }
  if (Object.values(AttenderStatus).includes(status as AttenderStatusValue)) {
    return ATTENDER_STATUS_CLASSES[status as AttenderStatusValue] ?? '';
  }
  if (Object.values(CampaignStatus).includes(status as CampaignStatusValue)) {
    return CAMPAIGN_STATUS_CLASSES[status as CampaignStatusValue] ?? '';
  }
  return '';
}

// ---------------------------------------------------------------------------
// Filter-option lists (plural labels for list/header filter dropdowns)
// ---------------------------------------------------------------------------

// Reference data + date-driven entities that only model available/retired (no `pendente`).
export const AVAILABILITY_STATUS_FILTER_OPTIONS: { value: ActiveStatusValue; label: string }[] = [
  { value: ActiveStatus.Active, label: 'Ativos' },
  { value: ActiveStatus.Inactive, label: 'Inativos' }
];

// User accounts — like availability but include `pendente` (self-registrations awaiting approval).
export const USER_STATUS_FILTER_OPTIONS: { value: ActiveStatusValue; label: string }[] = [
  { value: ActiveStatus.Active, label: 'Ativos' },
  { value: ActiveStatus.Inactive, label: 'Inativos' },
  { value: ActiveStatus.Pending, label: 'Pendentes' }
];

// Finance entry status (no `all` sentinel — DataTable's header filter adds "Todos" itself).
export const ENTRY_STATUS_FILTER_OPTIONS: { value: EntryStatusValue; label: string }[] = [
  { value: EntryStatus.Pending, label: 'Pendente' },
  { value: EntryStatus.Paid, label: 'Paga' },
  { value: EntryStatus.Cancelled, label: 'Cancelada' }
];

export const ATTENDER_STATUS_FILTER_OPTIONS: { value: AttenderStatusValue; label: string }[] = [
  { value: AttenderStatus.Active, label: 'Ativos' },
  { value: AttenderStatus.Inactive, label: 'Inativos' },
  { value: AttenderStatus.Dismissed, label: 'Desligados' },
  { value: AttenderStatus.Transferred, label: 'Transferidos' },
  { value: AttenderStatus.Deceased, label: 'Falecidos' }
];

export const CAMPAIGN_STATUS_FILTER_OPTIONS: { value: CampaignStatusValue; label: string }[] = [
  { value: CampaignStatus.Active, label: 'Ativas' },
  { value: CampaignStatus.Ended, label: 'Encerradas' }
];

// ---------------------------------------------------------------------------
// Member-lifecycle FSM mirror (server: apps/api/.../attenders/service.ts assertAttenderTransition)
// ---------------------------------------------------------------------------
export const ATTENDER_TERMINAL: readonly AttenderStatusValue[] = ATTENDER_TERMINAL_STATUSES;

export function isAttenderTerminal(status: string): boolean {
  return (ATTENDER_TERMINAL as readonly string[]).includes(status);
}

// The set of states a member can move to from `from`, excluding `from` itself.
export function allowedAttenderTargets(from: AttenderStatusValue): AttenderStatusValue[] {
  if (isAttenderTerminal(from)) return [AttenderStatus.Active];
  // ativo / inativo → the other reversible state plus every formal exit.
  return [
    from === AttenderStatus.Active ? AttenderStatus.Inactive : AttenderStatus.Active,
    ...ATTENDER_TERMINAL
  ];
}
