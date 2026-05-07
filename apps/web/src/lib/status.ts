export const ActiveStatus = {
  Active: 'ativo',
  Inactive: 'inativo',
  Pending: 'pendente'
} as const;
export type ActiveStatusValue = (typeof ActiveStatus)[keyof typeof ActiveStatus];

export const EntryStatus = {
  Pending: 'pendente',
  Paid: 'paga',
  Cancelled: 'cancelada'
} as const;
export type EntryStatusValue = (typeof EntryStatus)[keyof typeof EntryStatus];

export const ClosingStatus = {
  Open: 'aberto',
  InReview: 'em revisão',
  Approved: 'aprovado',
  Closed: 'fechado'
} as const;
export type ClosingStatusValue = (typeof ClosingStatus)[keyof typeof ClosingStatus];

export const MinuteStatus = {
  AwaitingApproval: 'aguardando aprovação',
  Approved: 'aprovada',
  Replaced: 'substituída'
} as const;
export type MinuteStatusValue = (typeof MinuteStatus)[keyof typeof MinuteStatus];
