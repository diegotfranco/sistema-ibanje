import { pgEnum } from 'drizzle-orm/pg-core';
import {
  MEETING_TYPE_VALUES,
  ATTENDER_STATUS_VALUES,
  FUND_STATUS_VALUES
} from '@sistema-ibanje/shared';

export const activeStatus = pgEnum('active_status', ['ativo', 'inativo', 'pendente']);
export const attenderStatus = pgEnum('attender_status', ATTENDER_STATUS_VALUES);
export const fundStatus = pgEnum('fund_status', FUND_STATUS_VALUES);
export const transactionStatus = pgEnum('transaction_status', ['pendente', 'paga', 'cancelada']);
export const meetingType = pgEnum('meeting_type', MEETING_TYPE_VALUES);
export const minuteVersionStatus = pgEnum('minute_version_status', [
  'rascunho',
  'aguardando aprovação',
  'aprovada',
  'substituída'
]);
export const closingStatus = pgEnum('closing_status', [
  'aberto',
  'em revisão',
  'rejeitado',
  'aprovado',
  'fechado'
]);
export const membershipLetterType = pgEnum('membership_letter_type', [
  'pedido_de_carta_de_transferência',
  'carta_de_transferência'
]);
export const admissionMode = pgEnum('admission_mode', [
  'aclamação',
  'batismo',
  'carta de transferência',
  'profissão de fé'
]);
