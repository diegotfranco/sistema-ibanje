const PORTUGUESE_MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro'
];

export function formatDateExtenso(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const monthName = PORTUGUESE_MONTHS[month - 1];
    return `${day} de ${monthName} de ${year}`;
  } catch {
    return '';
  }
}

export function getAdmissionModeText(mode: string | null | undefined): string {
  switch (mode) {
    case 'aclamação':
      return 'recebido(a) por aclamação';
    case 'batismo':
      return 'batizado(a)';
    case 'carta de transferência':
      return 'recebido(a) por carta de transferência';
    case 'profissão de fé':
      return 'recebido(a) por profissão de fé';
    default:
      return '';
  }
}

const INCOMING_REQUEST_TEMPLATE = `[Letterhead: {{church_logo}} {{church_name}} {{church_phone}} {{church_email}} {{church_address}}]
{{church_city}}/{{church_state}}, {{letter_date_extenso}}.

À {{other_church_name}}{{#other_church_address}} - {{other_church_address}}{{/}}
{{other_church_city}} - {{other_church_state}}

Ref: Transferência de membro.

Prezados irmãos,
Saudações no Senhor.

   Pela presente, informamos-vos que a Irmã/Irmão {{attender_name}} vem congregando
em nossa igreja desde {{congregating_since_year}}, sendo dizimista fiel e assídua nas
programações de nossa igreja. Por seu testemunho, no dia {{member_since_extenso}}
foi {{admission_mode_text}} em assembleia regular.

{{additional_context}}

   No amor de Cristo, e sempre com o objetivo de glorificá-lo em todos os nossos atos,
pensamentos e palavras.

Atenciosamente.

____________________________            ____________________________
{{signing_secretary_name}}              {{signing_president_name}}
{{signing_secretary_title}}             {{signing_president_title}}`;

const OUTGOING_TRANSFER_TEMPLATE = `[Letterhead: {{church_logo}} {{church_name}} {{church_phone}} {{church_email}} {{church_address}}]
{{church_city}}/{{church_state}}, {{letter_date_extenso}}.

À {{other_church_name}}{{#other_church_address}} - {{other_church_address}}{{/}}
{{other_church_city}} - {{other_church_state}}

Ref: Carta de transferência de membro.

Prezados irmãos,
Saudações no Senhor.

   Em atendimento ao pedido de Vossa Senhoria, comunicamos pela presente que a(o)
Irmã/Irmão {{attender_name}}, membro de nossa igreja desde {{member_since_extenso}},
encontra-se em plena comunhão e é por nós transferido(a) para essa amada igreja.

{{additional_context}}

   No amor de Cristo, e sempre com o objetivo de glorificá-lo em todos os nossos atos,
pensamentos e palavras.

Atenciosamente.

____________________________            ____________________________
{{signing_secretary_name}}              {{signing_president_name}}
{{signing_secretary_title}}             {{signing_president_title}}`;

interface LetterContext {
  letter_date: string;
  letter_date_extenso: string;
  other_church_name: string;
  other_church_address?: string;
  other_church_city: string;
  other_church_state?: string;
  signing_secretary_name: string;
  signing_secretary_title: string;
  signing_president_name: string;
  signing_president_title: string;
  additional_context?: string;
  church_logo?: string;
  church_name: string;
  church_phone?: string;
  church_email?: string;
  church_address: string;
  church_city: string;
  church_state: string;
  attender_name: string;
  congregating_since_year?: number;
  member_since_extenso: string;
  admission_mode_text: string;
}

function interpolateTemplate(template: string, context: LetterContext): string {
  let result = template;

  // Handle conditional blocks {{#field}}...{{/}}
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\}\}/g, (match, field, content) => {
    const value = context[field as keyof LetterContext];
    return value ? content : '';
  });

  // Handle variable substitution
  Object.entries(context).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const stringValue = value !== null && value !== undefined ? String(value) : '';
    result = result.split(placeholder).join(stringValue);
  });

  return result;
}

export function renderLetter(
  letter: {
    type: string;
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
  },
  attender: {
    name: string;
    congregatingSinceYear?: number | null;
    memberSince?: string | null;
    admissionMode?: string | null;
  },
  settings: {
    name: string;
    phone?: string | null;
    email?: string | null;
    addressStreet: string;
    addressNumber: string;
    addressDistrict: string;
    addressCity: string;
    addressState: string;
    logoPath?: string | null;
  }
): string {
  const template =
    letter.type === 'pedido_de_carta_de_transferência'
      ? INCOMING_REQUEST_TEMPLATE
      : OUTGOING_TRANSFER_TEMPLATE;

  const churchAddress = [settings.addressStreet, settings.addressNumber, settings.addressDistrict]
    .filter(Boolean)
    .join(', ');

  const context: LetterContext = {
    letter_date: letter.letterDate,
    letter_date_extenso: formatDateExtenso(letter.letterDate),
    other_church_name: letter.otherChurchName,
    other_church_address: letter.otherChurchAddress ?? undefined,
    other_church_city: letter.otherChurchCity,
    other_church_state: letter.otherChurchState ?? undefined,
    signing_secretary_name: letter.signingSecretaryName,
    signing_secretary_title: letter.signingSecretaryTitle,
    signing_president_name: letter.signingPresidentName,
    signing_president_title: letter.signingPresidentTitle,
    additional_context: letter.additionalContext ?? undefined,
    church_logo: settings.logoPath ?? undefined,
    church_name: settings.name,
    church_phone: settings.phone ?? undefined,
    church_email: settings.email ?? undefined,
    church_address: churchAddress,
    church_city: settings.addressCity,
    church_state: settings.addressState,
    attender_name: attender.name,
    congregating_since_year: attender.congregatingSinceYear ?? undefined,
    member_since_extenso: formatDateExtenso(attender.memberSince),
    admission_mode_text: getAdmissionModeText(attender.admissionMode)
  };

  return interpolateTemplate(template, context);
}
