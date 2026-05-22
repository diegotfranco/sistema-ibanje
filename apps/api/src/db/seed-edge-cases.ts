/**
 * Synthetic edge-case data inserted on top of the dumped legacy fixtures so
 * `pnpm db:seed` exercises every interesting branch of the app: closed-period
 * blocks, installments, pending users, custom permission overrides, multi-
 * version minutes, accented names, membership letters, large/negative amounts.
 *
 * Every row references foreign keys by NAME or EMAIL — the seed orchestrator
 * resolves them at insert time.
 */
import { renderTemplate } from './seed-templates.js';
import { SEED_MEETING_TYPES } from './seed-data.js';
import type { SeedMinuteTemplate } from './seed-templates.js';

// ---------------------------------------------------------------------------
// attenders — accents, missing fields, link to demo user
// ---------------------------------------------------------------------------
export type EdgeCaseAttender = {
  name: string;
  linkToUserEmail?: string;
  birthDate?: string | null;
  addressStreet?: string | null;
  addressNumber?: number | null;
  addressDistrict?: string | null;
  state?: string | null;
  city?: string | null;
  postalCode?: string | null;
  email?: string | null;
  phone?: string | null;
  isMember?: boolean;
  memberSince?: string | null;
  congregatingSinceYear?: number | null;
  admissionMode?: 'aclamação' | 'batismo' | 'carta de transferência' | 'profissão de fé' | null;
};

export const EDGE_CASE_ATTENDERS: EdgeCaseAttender[] = [
  {
    name: 'João da Silva',
    linkToUserEmail: 'membro@email.com',
    birthDate: '1985-05-15',
    addressStreet: 'Rua das Flores',
    addressNumber: 123,
    addressDistrict: 'Centro',
    state: 'SP',
    city: 'São Paulo',
    postalCode: '01001000',
    email: 'joao.silva@email.com',
    phone: '11987654321',
    isMember: true,
    memberSince: '2010-04-18',
    congregatingSinceYear: 2008,
    admissionMode: 'aclamação'
  },
  {
    // accents, ç, and apostrophe
    name: "Conceição d'Ávila",
    birthDate: '1972-09-03',
    city: 'São Paulo',
    state: 'SP',
    isMember: true,
    memberSince: '2015-08-01',
    admissionMode: 'batismo'
  },
  {
    // partial address — street only, no number, no CEP
    name: 'André Pereira',
    addressStreet: 'Rua Santo Amaro',
    city: 'São Paulo',
    state: 'SP',
    isMember: false
  },
  {
    // no phone, no email
    name: 'Beatriz Nogueira',
    birthDate: '1990-02-20',
    city: 'Campinas',
    state: 'SP',
    isMember: true,
    memberSince: '2020-12-13',
    admissionMode: 'profissão de fé'
  }
];

// ---------------------------------------------------------------------------
// users beyond SEED_DEMO_USERS — pending, deactivated
// ---------------------------------------------------------------------------
export type EdgeCaseUser = {
  name: string;
  email: string;
  password: string;
  roleName: string;
  status: 'ativo' | 'inativo' | 'pendente';
  /** When true, no permissions are mirrored from the role (used for pendente). */
  skipPermissions?: boolean;
};

export const EDGE_CASE_USERS: EdgeCaseUser[] = [
  {
    name: 'Pendente da Silva',
    email: 'pendente@email.com',
    password: 'pendente123',
    roleName: 'Membro',
    status: 'pendente',
    skipPermissions: true
  },
  {
    name: 'Inativo da Silva',
    email: 'inativo@email.com',
    password: 'inativo123',
    roleName: 'Membro',
    status: 'inativo'
  }
];

/**
 * Extra permissions granted to a user beyond what the role provides — exercises
 * the "user has more permissions than role" branch of the permission check.
 */
export const EDGE_CASE_USER_PERMISSION_OVERRIDES: {
  userEmail: string;
  moduleName: string;
  permissionName: string;
}[] = [
  // membro@email.com is a regular Membro (Acessar on Atas/Congregados) — give
  // them Editar on Atas so the override is visible in the permissions UI.
  { userEmail: 'membro@email.com', moduleName: 'Atas', permissionName: 'Editar' }
];

// ---------------------------------------------------------------------------
// meetings, agenda items, minutes — fully template-rendered
// ---------------------------------------------------------------------------
export type EdgeCaseMeeting = {
  meetingDate: string;
  type: (typeof SEED_MEETING_TYPES)[keyof typeof SEED_MEETING_TYPES];
  isPublic?: boolean;
};

export const EDGE_CASE_MEETINGS: EdgeCaseMeeting[] = [
  { meetingDate: '2024-03-10', type: SEED_MEETING_TYPES.Ordinary },
  { meetingDate: '2024-09-15', type: SEED_MEETING_TYPES.Ordinary },
  { meetingDate: '2025-11-30', type: SEED_MEETING_TYPES.Extraordinary }
];

export type EdgeCaseAgendaItem = {
  meetingDate: string;
  order: number;
  title: string;
  description?: string | null;
  createdByUserEmail: string;
};

export const EDGE_CASE_AGENDA_ITEMS: EdgeCaseAgendaItem[] = [
  // Multiple, varied agenda items on the first meeting.
  {
    meetingDate: '2024-03-10',
    order: 0,
    title: 'Leitura e aprovação da ata anterior',
    createdByUserEmail: 'secretario.resp@email.com'
  },
  {
    meetingDate: '2024-03-10',
    order: 1,
    title: 'Relatório financeiro do primeiro bimestre',
    createdByUserEmail: 'tesoureiro.resp@email.com'
  },
  {
    meetingDate: '2024-03-10',
    order: 2,
    title: 'Movimento de membros',
    description: 'Apresentação de novos membros recebidos por aclamação e batismo.',
    createdByUserEmail: 'secretario.resp@email.com'
  },
  {
    meetingDate: '2024-03-10',
    order: 3,
    title: 'Encerramento',
    description: 'Oração e encerramento da sessão.',
    createdByUserEmail: 'secretario.resp@email.com'
  },
  {
    meetingDate: '2024-09-15',
    order: 0,
    title: 'Relatório financeiro do segundo trimestre',
    createdByUserEmail: 'tesoureiro.resp@email.com'
  },
  {
    meetingDate: '2024-09-15',
    order: 1,
    title: 'Encerramento',
    createdByUserEmail: 'secretario.resp@email.com'
  },
  {
    meetingDate: '2025-11-30',
    order: 0,
    title: 'Apresentação dos fatos apurados',
    createdByUserEmail: 'presidente@email.com'
  },
  {
    meetingDate: '2025-11-30',
    order: 1,
    title: 'Manifestação do membro envolvido',
    createdByUserEmail: 'presidente@email.com'
  },
  {
    meetingDate: '2025-11-30',
    order: 2,
    title: 'Deliberação da Assembleia',
    createdByUserEmail: 'presidente@email.com'
  }
];

export type EdgeCaseMinuteVersion = {
  version: number;
  status: 'rascunho' | 'aguardando aprovação' | 'aprovada' | 'substituída';
  reasonForChange: string;
  createdByUserEmail: string;
  approvedAtMeetingDate?: string;
  /** Resolved at construction time from the named template + vars. */
  contentJson: unknown;
};

export type EdgeCaseMinute = {
  meetingDate: string;
  minuteNumber: string;
  presidingPastorName?: string | null;
  secretaryName?: string | null;
  openingTime?: string | null;
  closingTime?: string | null;
  versions: EdgeCaseMinuteVersion[];
};

function buildMinuteVersions(
  template: SeedMinuteTemplate,
  vars: Record<string, string>,
  versions: Array<
    Omit<EdgeCaseMinuteVersion, 'contentJson'> & {
      varsOverride?: Record<string, string>;
    }
  >
): EdgeCaseMinuteVersion[] {
  return versions.map((v) => ({
    version: v.version,
    status: v.status,
    reasonForChange: v.reasonForChange,
    createdByUserEmail: v.createdByUserEmail,
    approvedAtMeetingDate: v.approvedAtMeetingDate,
    contentJson: renderTemplate(template.content, { ...vars, ...(v.varsOverride ?? {}) })
  }));
}

// Templates inlined here just so the edge cases don't depend on resolving them
// at insert time. They mirror the seed-templates entries by name.
const TEMPLATE_BY_NAME = new Map<string, SeedMinuteTemplate>();
import { SEED_MINUTE_TEMPLATES } from './seed-templates.js';
for (const t of SEED_MINUTE_TEMPLATES) TEMPLATE_BY_NAME.set(t.name, t);

const ordinaryTemplate = TEMPLATE_BY_NAME.get('Modelo Padrão — Assembleia Ordinária')!;
const disciplineTemplate = TEMPLATE_BY_NAME.get('Modelo — Assembleia Extraordinária (Disciplina)')!;

export const EDGE_CASE_MINUTES: EdgeCaseMinute[] = [
  {
    // Single-version approved minute (typical case).
    meetingDate: '2024-03-10',
    minuteNumber: '900',
    presidingPastorName: 'Pr. Deucir Araújo de Almeida',
    secretaryName: 'Secretário Responsável da Silva',
    openingTime: '17:10',
    closingTime: '19:00',
    versions: buildMinuteVersions(
      ordinaryTemplate,
      {
        minute_number: '900',
        church_name: 'Igreja Batista Nova Jerusalém',
        church_address: 'Rua Santo Amaro, 286 - Vila Carrão',
        meeting_date_extenso: '10 de março de 2024',
        presiding_pastor_name: 'Pr. Deucir Araújo de Almeida',
        opening_time: '17:10',
        previous_minute_number: '899',
        pautas: 'Apresentação do relatório financeiro do bimestre e movimento de membros.',
        closing_time: '19:00',
        secretary_name: 'Secretário Responsável da Silva'
      },
      [
        {
          version: 1,
          status: 'aprovada',
          reasonForChange: 'Criação inicial da ata.',
          createdByUserEmail: 'secretario.resp@email.com',
          approvedAtMeetingDate: '2024-03-10'
        }
      ]
    )
  },
  {
    // Three versions exercising the full lifecycle: rascunho → aguardando → aprovada.
    meetingDate: '2024-09-15',
    minuteNumber: '901',
    presidingPastorName: 'Pr. Deucir Araújo de Almeida',
    secretaryName: 'Secretário Responsável da Silva',
    openingTime: '17:05',
    closingTime: '19:15',
    versions: buildMinuteVersions(
      ordinaryTemplate,
      {
        minute_number: '901',
        church_name: 'Igreja Batista Nova Jerusalém',
        church_address: 'Rua Santo Amaro, 286 - Vila Carrão',
        meeting_date_extenso: '15 de setembro de 2024',
        presiding_pastor_name: 'Pr. Deucir Araújo de Almeida',
        opening_time: '17:05',
        previous_minute_number: '900',
        pautas: 'Relatório financeiro do segundo trimestre e encerramento.',
        closing_time: '19:15',
        secretary_name: 'Secretário Responsável da Silva'
      },
      [
        {
          version: 1,
          status: 'substituída',
          reasonForChange: 'Versão inicial — substituída por correção do valor do orçamento.',
          createdByUserEmail: 'secretario@email.com',
          varsOverride: { pautas: 'Relatório financeiro com valor preliminar.' }
        },
        {
          version: 2,
          status: 'aguardando aprovação',
          reasonForChange: 'Correção do valor do orçamento e inclusão da equipe de louvor.',
          createdByUserEmail: 'secretario.resp@email.com',
          varsOverride: {
            pautas:
              'Relatório financeiro do trimestre (com valor corrigido) e nomeação da equipe de louvor para o retiro.'
          }
        },
        {
          version: 3,
          status: 'rascunho',
          reasonForChange: 'Rascunho para incluir nova pauta sobre orçamento do próximo retiro.',
          createdByUserEmail: 'secretario@email.com'
        }
      ]
    )
  },
  {
    // Extraordinária using the disciplina template.
    meetingDate: '2025-11-30',
    minuteNumber: '902',
    presidingPastorName: 'Pr. Deucir Araújo de Almeida',
    secretaryName: 'Secretário Responsável da Silva',
    openingTime: '20:00',
    closingTime: '21:30',
    versions: buildMinuteVersions(
      disciplineTemplate,
      {
        minute_number: '902',
        church_name: 'Igreja Batista Nova Jerusalém',
        meeting_date_extenso: '30 de novembro de 2025',
        presiding_pastor_name: 'Pr. Deucir Araújo de Almeida',
        opening_time: '20:00',
        discipline_facts:
          'Fatos descritos em comunicação confidencial do conselho ministerial recebida em 25/11/2025.',
        discipline_outcome:
          'Foi deliberada a aplicação de medida de aconselhamento pastoral por 6 meses, sem afastamento das funções congregacionais',
        closing_time: '21:30'
      },
      [
        {
          version: 1,
          status: 'aprovada',
          reasonForChange: 'Criação inicial da ata disciplinar.',
          createdByUserEmail: 'secretario.resp@email.com',
          approvedAtMeetingDate: '2025-11-30'
        }
      ]
    )
  }
];

// ---------------------------------------------------------------------------
// monthly closings — covers every closing_status enum value
// ---------------------------------------------------------------------------
export type EdgeCaseClosing = {
  periodYear: number;
  periodMonth: number;
  status: 'aberto' | 'em revisão' | 'rejeitado' | 'aprovado' | 'fechado';
  closingBalance?: string | null;
  treasurerNotes?: string | null;
  accountantNotes?: string | null;
  submittedByUserEmail?: string;
  closedByUserEmail?: string;
};

export const EDGE_CASE_CLOSINGS: EdgeCaseClosing[] = [
  // Current month — open, no submission yet.
  { periodYear: 2026, periodMonth: 5, status: 'aberto' },
  // Last month — submitted for review.
  {
    periodYear: 2026,
    periodMonth: 4,
    status: 'em revisão',
    closingBalance: '12340.55',
    treasurerNotes: 'Submetido para revisão da comissão.',
    submittedByUserEmail: 'tesoureiro.resp@email.com'
  },
  // Rejected — the comissão pushed back with notes.
  {
    periodYear: 2026,
    periodMonth: 3,
    status: 'rejeitado',
    closingBalance: '9876.10',
    treasurerNotes: 'Saldo conferido com extrato bancário.',
    accountantNotes: '[REVISAR] Divergência de R$ 120,00 entre extrato e lançamentos do dia 25.',
    submittedByUserEmail: 'tesoureiro.resp@email.com'
  },
  // Approved — ready for presidente to close.
  {
    periodYear: 2026,
    periodMonth: 2,
    status: 'aprovado',
    closingBalance: '8540.00',
    treasurerNotes: 'Fechamento mensal regular.',
    accountantNotes: 'Aprovado sem ressalvas.',
    submittedByUserEmail: 'tesoureiro.resp@email.com'
  },
  // Fully closed — exercises the "edits blocked" branch.
  {
    periodYear: 2026,
    periodMonth: 1,
    status: 'fechado',
    closingBalance: '7211.45',
    treasurerNotes: 'Fechamento mensal regular.',
    accountantNotes: 'Aprovado.',
    submittedByUserEmail: 'tesoureiro.resp@email.com',
    closedByUserEmail: 'presidente@email.com'
  }
];

// ---------------------------------------------------------------------------
// finance entries — installments, large amount, closed-period block, negative balance
// ---------------------------------------------------------------------------
export type EdgeCaseIncome = {
  referenceDate: string;
  depositDate?: string;
  amount: string;
  categoryName: string;
  attenderName?: string | null;
  paymentMethodName: string;
  designatedFundName?: string | null;
  notes?: string | null;
  createdByUserEmail: string;
};

export const EDGE_CASE_INCOME: EdgeCaseIncome[] = [
  // Entry on the LAST DAY of the closed period (2026-01) — verifies the
  // assertPeriodEditable block kicks in when someone tries to edit.
  {
    referenceDate: '2026-01-31',
    amount: '500.00',
    categoryName: 'Dízimo',
    attenderName: "Conceição d'Ávila",
    paymentMethodName: 'Transferência Bancária',
    notes:
      'Caso-limite: lançamento no último dia do período fechado — tentativas de edição devem ser bloqueadas.',
    createdByUserEmail: 'tesoureiro.resp@email.com'
  },
  // Designated-fund inflow.
  {
    referenceDate: '2026-02-14',
    amount: '350.00',
    categoryName: 'Oferta',
    attenderName: 'João da Silva',
    paymentMethodName: 'Dinheiro',
    designatedFundName: 'Fundo Missionário',
    createdByUserEmail: 'tesoureiro@email.com'
  },
  // Income for a campanha fund (proves the campanha fan-out is wired up).
  {
    referenceDate: '2026-04-07',
    amount: '200.00',
    categoryName: 'Oferta',
    attenderName: 'André Pereira',
    paymentMethodName: 'Dinheiro',
    designatedFundName: 'Desafio Construção',
    createdByUserEmail: 'tesoureiro@email.com'
  }
];

export type EdgeCaseExpense = {
  referenceDate: string;
  description: string;
  total: string;
  amount: string;
  installment: number;
  totalInstallments: number;
  categoryName: string;
  paymentMethodName: string;
  designatedFundName?: string | null;
  notes?: string | null;
  /** Synthetic id used to link installments together — the seed maps it to the actual parent id. */
  installmentGroupId?: string;
  isInstallmentParent?: boolean;
  createdByUserEmail: string;
};

const INSTALLMENT_GROUP = 'edge-installments-projetor';
export const EDGE_CASE_EXPENSES: EdgeCaseExpense[] = [
  // 5-installment plan — 1 parent + 5 children spanning month boundaries.
  // Total R$ 5.000,00, R$ 1.000,00 per installment.
  {
    referenceDate: '2026-02-10',
    description: 'Compra de projetor multimídia (parcelado em 5x)',
    total: '5000.00',
    amount: '1000.00',
    installment: 1,
    totalInstallments: 5,
    categoryName: 'Compra de Equipamentos',
    paymentMethodName: 'Cartão de Crédito',
    installmentGroupId: INSTALLMENT_GROUP,
    isInstallmentParent: true,
    createdByUserEmail: 'tesoureiro.resp@email.com'
  },
  {
    referenceDate: '2026-03-10',
    description: 'Compra de projetor multimídia (parcela 2/5)',
    total: '5000.00',
    amount: '1000.00',
    installment: 2,
    totalInstallments: 5,
    categoryName: 'Compra de Equipamentos',
    paymentMethodName: 'Cartão de Crédito',
    installmentGroupId: INSTALLMENT_GROUP,
    createdByUserEmail: 'tesoureiro.resp@email.com'
  },
  {
    referenceDate: '2026-04-10',
    description: 'Compra de projetor multimídia (parcela 3/5)',
    total: '5000.00',
    amount: '1000.00',
    installment: 3,
    totalInstallments: 5,
    categoryName: 'Compra de Equipamentos',
    paymentMethodName: 'Cartão de Crédito',
    installmentGroupId: INSTALLMENT_GROUP,
    createdByUserEmail: 'tesoureiro.resp@email.com'
  },
  {
    referenceDate: '2026-05-10',
    description: 'Compra de projetor multimídia (parcela 4/5)',
    total: '5000.00',
    amount: '1000.00',
    installment: 4,
    totalInstallments: 5,
    categoryName: 'Compra de Equipamentos',
    paymentMethodName: 'Cartão de Crédito',
    installmentGroupId: INSTALLMENT_GROUP,
    createdByUserEmail: 'tesoureiro.resp@email.com'
  },
  {
    referenceDate: '2026-06-10',
    description: 'Compra de projetor multimídia (parcela 5/5)',
    total: '5000.00',
    amount: '1000.00',
    installment: 5,
    totalInstallments: 5,
    categoryName: 'Compra de Equipamentos',
    paymentMethodName: 'Cartão de Crédito',
    installmentGroupId: INSTALLMENT_GROUP,
    createdByUserEmail: 'tesoureiro.resp@email.com'
  },
  // Very large amount — covers the upper bound of numeric(12,2) formatting.
  {
    referenceDate: '2026-04-20',
    description: 'Reforma estrutural do templo (parcela única)',
    total: '999999.99',
    amount: '999999.99',
    installment: 1,
    totalInstallments: 1,
    categoryName: 'Manutenção Predial',
    paymentMethodName: 'Transferência Bancária',
    notes: 'Caso-limite: valor próximo ao máximo de numeric(12,2).',
    createdByUserEmail: 'tesoureiro.resp@email.com'
  },
  // Negative-balance scenario on the "Desafio Construção" fund: a single
  // R$ 3.000 outflow against R$ 200 inflow in the same period.
  {
    referenceDate: '2026-04-15',
    description: 'Pagamento de empreiteira — Desafio Construção',
    total: '3000.00',
    amount: '3000.00',
    installment: 1,
    totalInstallments: 1,
    categoryName: 'Manutenção Predial',
    paymentMethodName: 'Transferência Bancária',
    designatedFundName: 'Desafio Construção',
    notes: 'Caso-limite: saldo do fundo fica negativo no mês.',
    createdByUserEmail: 'tesoureiro.resp@email.com'
  }
];

// ---------------------------------------------------------------------------
// membership letters — both supported types
// ---------------------------------------------------------------------------
export type EdgeCaseLetter = {
  attenderName: string;
  type: 'pedido_de_carta_de_transferência' | 'carta_de_transferência';
  letterDate: string;
  otherChurchName: string;
  otherChurchAddress?: string | null;
  otherChurchCity: string;
  otherChurchState?: string | null;
  signingSecretaryName: string;
  signingSecretaryTitle: string;
  signingPresidentName: string;
  signingPresidentTitle: string;
  additionalContext?: string | null;
  createdByUserEmail: string;
};

export const EDGE_CASE_LETTERS: EdgeCaseLetter[] = [
  // Incoming — a pedido de carta de transferência for André Pereira.
  {
    attenderName: 'André Pereira',
    type: 'pedido_de_carta_de_transferência',
    letterDate: '2026-03-20',
    otherChurchName: 'Igreja Batista do Calvário',
    otherChurchAddress: 'Av. Brasil, 1500',
    otherChurchCity: 'Campinas',
    otherChurchState: 'SP',
    signingSecretaryName: 'Secretário Responsável da Silva',
    signingSecretaryTitle: '1º Secretário(a)',
    signingPresidentName: 'Pr. Deucir Araújo de Almeida',
    signingPresidentTitle: 'Presidente',
    additionalContext: 'Solicitação de carta para recepção do irmão na congregação.',
    createdByUserEmail: 'secretario.resp@email.com'
  },
  // Outgoing — Beatriz Nogueira transferida para outra igreja.
  {
    attenderName: 'Beatriz Nogueira',
    type: 'carta_de_transferência',
    letterDate: '2026-05-05',
    otherChurchName: 'Primeira Igreja Batista de São Paulo',
    otherChurchCity: 'São Paulo',
    otherChurchState: 'SP',
    signingSecretaryName: 'Secretário Responsável da Silva',
    signingSecretaryTitle: '1º Secretário(a)',
    signingPresidentName: 'Pr. Deucir Araújo de Almeida',
    signingPresidentTitle: 'Presidente',
    createdByUserEmail: 'secretario.resp@email.com'
  }
];
