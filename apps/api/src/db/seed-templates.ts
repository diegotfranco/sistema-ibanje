/**
 * Minute (ata) templates seeded into the `minute_templates` table.
 *
 * Each meeting type has TWO templates: a generic default and a scenario-specific
 * alternative. The schema's `uq_default_template_per_type` unique constraint
 * limits us to one default per type — the alternatives use `isDefault: false`.
 *
 * Templates are TipTap-compatible JSON. The renderTemplate helper walks the
 * tree and substitutes every `{{key}}` token in text nodes with the matching
 * value from the supplied `vars` object — used by demo minutes so they look
 * like real generated documents instead of freeform HTML.
 */
import { SEED_MEETING_TYPES } from './seed-data.js';

type TipTapNode = {
  type: string;
  text?: string;
  marks?: Array<{ type: string }>;
  content?: TipTapNode[];
  attrs?: Record<string, unknown>;
};

export type TemplateVars = Record<string, string>;

/**
 * Walk a TipTap node tree and substitute `{{varName}}` tokens inside text nodes.
 * Pure (returns a new tree) so the same template can be rendered with different
 * variable sets.
 */
export function renderTemplate(node: TipTapNode, vars: TemplateVars): TipTapNode {
  const next: TipTapNode = { type: node.type };
  if (node.marks) next.marks = node.marks.map((m) => ({ ...m }));
  if (node.attrs) next.attrs = { ...node.attrs };
  if (typeof node.text === 'string') {
    next.text = node.text.replace(/\{\{(\w+)\}\}/g, (_match, key) => vars[key] ?? `{{${key}}}`);
  }
  if (node.content) next.content = node.content.map((c) => renderTemplate(c, vars));
  return next;
}

// ---------------------------------------------------------------------------
// templates
// ---------------------------------------------------------------------------

const ordinaryDefaultContent: TipTapNode = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', marks: [{ type: 'bold' }], text: 'Ata de número {{minute_number}}' },
        {
          type: 'text',
          text: ' da Assembleia Ordinária Bimestral da {{church_name}}, situada na {{church_address}}, no dia {{meeting_date_extenso}}. O Pastor {{presiding_pastor_name}} fez uma reflexão e declarou aberta a Assembleia às {{opening_time}}. '
        },
        {
          type: 'text',
          marks: [{ type: 'bold' }, { type: 'underline' }],
          text: 'Leitura da Ata de nº {{previous_minute_number}}:'
        },
        { type: 'text', text: ' foi lida e aprovada sem ressalva a Ata anterior. ' },
        {
          type: 'text',
          marks: [{ type: 'bold' }, { type: 'underline' }],
          text: 'Relatório Financeiro:'
        },
        { type: 'text', text: ' ' },
        {
          type: 'text',
          marks: [{ type: 'bold' }, { type: 'underline' }],
          text: 'Movimento de membros:'
        },
        { type: 'text', text: ' ' },
        {
          type: 'text',
          marks: [{ type: 'bold' }, { type: 'underline' }],
          text: 'Comunicações:'
        },
        { type: 'text', text: ' ' },
        { type: 'text', marks: [{ type: 'bold' }, { type: 'underline' }], text: 'Pautas:' },
        { type: 'text', text: ' {{pautas}} ' }
      ]
    }
  ]
};

const ordinaryPosseContent: TipTapNode = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', marks: [{ type: 'bold' }], text: 'Ata de número {{minute_number}}' },
        {
          type: 'text',
          text: ' da Assembleia Ordinária da {{church_name}}, realizada no dia {{meeting_date_extenso}}, convocada especialmente para a posse da nova diretoria para o exercício de {{exercise_year}}. O Pastor {{presiding_pastor_name}} declarou aberta a sessão às {{opening_time}} e apresentou a comissão de eleição. '
        },
        {
          type: 'text',
          marks: [{ type: 'bold' }, { type: 'underline' }],
          text: 'Apresentação da chapa eleita:'
        },
        { type: 'text', text: ' {{elected_board}}. ' },
        {
          type: 'text',
          marks: [{ type: 'bold' }, { type: 'underline' }],
          text: 'Posse:'
        },
        {
          type: 'text',
          text: ' os membros da diretoria eleita foram empossados, comprometendo-se diante da Assembleia a desempenhar seus cargos com fidelidade. '
        },
        {
          type: 'text',
          marks: [{ type: 'bold' }, { type: 'underline' }],
          text: 'Pautas adicionais:'
        },
        { type: 'text', text: ' {{pautas}} ' }
      ]
    }
  ]
};

const extraordinaryDefaultContent: TipTapNode = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', marks: [{ type: 'bold' }], text: 'Ata de número {{minute_number}}' },
        {
          type: 'text',
          text: ' da Assembleia Extraordinária da {{church_name}}, devidamente inscrita no CNPJ sob nº {{church_cnpj}}, situada na {{church_address}}. Realizada no dia {{meeting_date_extenso}}. O presidente, {{presiding_pastor_name}}, deu início à devocional com uma oração. Foi declarada aberta às {{opening_time}}. '
        },
        { type: 'text', marks: [{ type: 'bold' }, { type: 'underline' }], text: 'Pautas:' },
        { type: 'text', text: ' {{pautas}} ' }
      ]
    }
  ]
};

const extraordinaryDisciplineContent: TipTapNode = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', marks: [{ type: 'bold' }], text: 'Ata de número {{minute_number}}' },
        {
          type: 'text',
          text: ' da Assembleia Extraordinária da {{church_name}}, realizada no dia {{meeting_date_extenso}}, convocada exclusivamente para tratar de assunto disciplinar referente a um membro da congregação. O presidente, {{presiding_pastor_name}}, declarou aberta a sessão às {{opening_time}}, reafirmando o caráter sigiloso da reunião. '
        },
        {
          type: 'text',
          marks: [{ type: 'bold' }, { type: 'underline' }],
          text: 'Fato apurado:'
        },
        { type: 'text', text: ' {{discipline_facts}} ' },
        {
          type: 'text',
          marks: [{ type: 'bold' }, { type: 'underline' }],
          text: 'Deliberação:'
        },
        { type: 'text', text: ' {{discipline_outcome}}. ' },
        {
          type: 'text',
          text: 'A Assembleia foi encerrada às {{closing_time}} com uma palavra de oração pelo membro envolvido.'
        }
      ]
    }
  ]
};

export type SeedMinuteTemplate = {
  meetingType: (typeof SEED_MEETING_TYPES)[keyof typeof SEED_MEETING_TYPES];
  name: string;
  isDefault: boolean;
  content: TipTapNode;
  defaultAgendaItems: Array<{ title: string; description?: string | null }>;
};

export const SEED_MINUTE_TEMPLATES: SeedMinuteTemplate[] = [
  {
    meetingType: SEED_MEETING_TYPES.Ordinary,
    name: 'Modelo Padrão — Assembleia Ordinária',
    isDefault: true,
    content: ordinaryDefaultContent,
    defaultAgendaItems: [
      { title: 'Pauta da Assembleia' },
      { title: 'Leitura da ata anterior' },
      { title: 'Relatório financeiro' },
      {
        title: 'Encerramento',
        description:
          'A assembleia foi encerrada às {{closing_time}}. Eu, {{secretary_name}}, lavrei a presente Ata, assinada por mim e pelo presidente.'
      }
    ]
  },
  {
    meetingType: SEED_MEETING_TYPES.Ordinary,
    name: 'Modelo — Assembleia Ordinária (Posse de Diretoria)',
    isDefault: false,
    content: ordinaryPosseContent,
    defaultAgendaItems: [
      { title: 'Apresentação da chapa eleita' },
      { title: 'Posse da nova diretoria' },
      {
        title: 'Encerramento',
        description:
          'A assembleia foi encerrada às {{closing_time}}. Eu, {{secretary_name}}, lavrei a presente Ata.'
      }
    ]
  },
  {
    meetingType: SEED_MEETING_TYPES.Extraordinary,
    name: 'Modelo Padrão — Assembleia Extraordinária',
    isDefault: true,
    content: extraordinaryDefaultContent,
    defaultAgendaItems: [
      {
        title: 'Encerramento',
        description:
          'Depois de discutida a pauta do dia, foi feita uma oração. Foi encerrada a Assembleia Extraordinária às {{closing_time}}. Eu, {{secretary_name}}, lavrei a presente Ata, assinada por mim e pelo presidente.'
      }
    ]
  },
  {
    meetingType: SEED_MEETING_TYPES.Extraordinary,
    name: 'Modelo — Assembleia Extraordinária (Disciplina)',
    isDefault: false,
    content: extraordinaryDisciplineContent,
    defaultAgendaItems: [
      { title: 'Apresentação dos fatos apurados' },
      { title: 'Manifestação do membro envolvido' },
      { title: 'Deliberação da Assembleia' },
      {
        title: 'Encerramento',
        description: 'A reunião foi encerrada com oração pelo membro às {{closing_time}}.'
      }
    ]
  }
];
