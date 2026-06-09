import React from 'react';
import {
  renderToBuffer,
  type DocumentProps,
  Document,
  Page,
  View,
  Text
} from '@react-pdf/renderer';
import * as repo from './repository.js';
import {
  getAttenderDonationsSummary,
  getAttenderDonationsEntries,
  listAttendersForExport
} from './service.js';
import { getChurchSettings } from '../church-settings/repository.js';
import { httpError } from '../../lib/errors.js';
import { formatPhone, formatCep } from '../../lib/format.js';
import { tw } from '../../lib/pdf/theme.js';
import { Letterhead } from '../../lib/pdf/Letterhead.js';
import { PageFooter } from '../../lib/pdf/PageFooter.js';
import {
  toChurchPdfData,
  loadChurchLogo,
  type ChurchPdfData,
  type PdfLogo
} from '../../lib/pdf/church.js';
import type {
  AttenderDonationsSummaryResponse,
  AttenderDonationsEntriesResponse,
  AttenderFilters
} from './schema.js';

type ChurchProps = { church: ChurchPdfData; logo?: PdfLogo };

async function loadChurchForPdf(): Promise<ChurchProps> {
  const settings = await getChurchSettings();
  if (!settings) throw httpError(409, 'Church settings not initialized');
  return { church: toChurchPdfData(settings), logo: await loadChurchLogo(settings.logoPath) };
}

function formatBRL(value: string): string {
  const num = parseFloat(value);
  return isNaN(num)
    ? value
    : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
}

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return d && m && y ? `${d}/${m}/${y}` : iso;
}

// Month-granular columns are stored as YYYYMM ints (e.g. 202404 -> '04/2024').
function formatMonthBR(yyyymm: number): string {
  return `${String(yyyymm % 100).padStart(2, '0')}/${Math.trunc(yyyymm / 100)}`;
}

function groupLabel(
  categoryName: string,
  campaignName: string | null,
  eventName: string | null
): string {
  const suffix = campaignName ?? eventName;
  return suffix ? `${categoryName} (${suffix})` : categoryName;
}

function PdfHeader({ title, generatedAt }: { title: string; generatedAt: string }) {
  return (
    <View style={tw('mb-6')}>
      <Text style={tw('text-lg font-bold')}>{title}</Text>
      <Text style={tw('text-xs text-gray-500 mt-1')}>Emitido em: {generatedAt}</Text>
    </View>
  );
}

// Annual statement: fixed Jan→Dez skeleton, empty months show "Sem contribuições".
function YearDonationsPdf({
  attenderName,
  summary,
  generatedAt,
  church,
  logo
}: {
  attenderName: string;
  summary: AttenderDonationsSummaryResponse;
  generatedAt: string;
} & ChurchProps) {
  return (
    <Document>
      <Page size="A4" style={tw('font-roboto p-10 pb-14 text-xs text-gray-900')}>
        <Letterhead church={church} logo={logo} />
        <PdfHeader
          title={`Contribuições ${summary.year} — ${attenderName}`}
          generatedAt={generatedAt}
        />

        {summary.months.map((m) => (
          <View key={m.month} style={tw('mb-3')} wrap={false}>
            <View style={tw('flex-row justify-between border-b border-gray-400 pb-1 mb-1')}>
              <Text style={tw('text-sm font-bold')}>{m.label}</Text>
              <Text style={tw('text-sm font-bold')}>{formatBRL(m.total)}</Text>
            </View>
            {m.groups.length === 0 ? (
              <Text style={tw('text-xs text-gray-400 pl-4 py-0.5')}>Sem contribuições</Text>
            ) : (
              m.groups.map((g, i) => (
                <View key={i} style={tw('flex-row justify-between py-0.5 pl-4')}>
                  <Text style={tw('text-xs text-gray-700')}>
                    {groupLabel(g.categoryName, g.campaignName, g.eventName)}
                  </Text>
                  <Text style={tw('text-xs text-gray-700')}>{formatBRL(g.total)}</Text>
                </View>
              ))
            )}
          </View>
        ))}

        <View style={tw('flex-row justify-between border-t border-gray-400 pt-2 mt-2')}>
          <Text style={tw('text-sm font-bold')}>Total do ano</Text>
          <Text style={tw('text-sm font-bold')}>{formatBRL(summary.grandTotal)}</Text>
        </View>
        <PageFooter churchName={church.name} />
      </Page>
    </Document>
  );
}

// Monthly receipt: per-transaction detail for one month.
function MonthDonationsPdf({
  attenderName,
  data,
  generatedAt,
  church,
  logo
}: {
  attenderName: string;
  data: AttenderDonationsEntriesResponse;
  generatedAt: string;
} & ChurchProps) {
  return (
    <Document>
      <Page size="A4" style={tw('font-roboto p-10 pb-14 text-xs text-gray-900')}>
        <Letterhead church={church} logo={logo} />
        <PdfHeader
          title={`Contribuições — ${data.label} — ${attenderName}`}
          generatedAt={generatedAt}
        />

        {data.entries.length === 0 ? (
          <View style={tw('py-4')}>
            <Text style={tw('text-xs text-gray-400 text-center')}>
              Sem contribuições neste mês.
            </Text>
          </View>
        ) : (
          data.entries.map((e) => (
            <View key={e.id} style={tw('flex-row justify-between border-b border-gray-200 py-1')}>
              <View style={tw('flex-row flex-1 pr-2')}>
                <Text style={tw('text-xs text-gray-500 w-20 shrink-0')}>
                  {formatDateBR(e.depositDate)}
                </Text>
                <Text style={tw('text-xs text-gray-800 flex-1')}>
                  {groupLabel(e.categoryName, e.campaignName, e.eventName)}
                  <Text style={tw('text-gray-400')}> · {e.paymentMethodName}</Text>
                </Text>
              </View>
              <Text style={tw('text-xs text-gray-800')}>{formatBRL(e.amount)}</Text>
            </View>
          ))
        )}

        <View style={tw('flex-row justify-between border-t border-gray-400 pt-2 mt-2')}>
          <Text style={tw('text-sm font-bold')}>Total do mês</Text>
          <Text style={tw('text-sm font-bold')}>{formatBRL(data.total)}</Text>
        </View>
        <PageFooter churchName={church.name} />
      </Page>
    </Document>
  );
}

type PdfScope = { year?: number } | { month: string };

export async function renderAttenderDonationsPdf(
  callerId: number,
  attenderId: number,
  scope: PdfScope
): Promise<{ buffer: Buffer; filename: string } | null> {
  const attender = await repo.findAttenderById(attenderId);
  if (!attender) return null;

  const generatedAt = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const safeName = attender.name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const { church, logo } = await loadChurchForPdf();

  let element: React.ReactElement<DocumentProps>;
  let suffix: string;

  if ('month' in scope) {
    const data = await getAttenderDonationsEntries(callerId, attenderId, scope.month);
    if (!data) return null;
    element = React.createElement(MonthDonationsPdf, {
      attenderName: attender.name,
      data,
      generatedAt,
      church,
      logo
    }) as React.ReactElement<DocumentProps>;
    suffix = scope.month;
  } else {
    const summary = await getAttenderDonationsSummary(callerId, attenderId, scope.year);
    if (!summary) return null;
    element = React.createElement(YearDonationsPdf, {
      attenderName: attender.name,
      summary,
      generatedAt,
      church,
      logo
    }) as React.ReactElement<DocumentProps>;
    suffix = String(summary.year);
  }

  const buffer = await renderToBuffer(element);
  return { buffer, filename: `contribuicoes-${safeName}-${suffix}.pdf` };
}

// --- Roster export --------------------------------------------------------

type RosterRow = Awaited<ReturnType<typeof listAttendersForExport>>[number];

function formatCityState(city: string | null, state: string | null): string {
  if (!city) return '—';
  return state ? `${city} / ${state}` : city;
}

// Allowlist of exportable columns. Anything outside this map is dropped, so the
// `columns` query param can't be used to leak unexpected fields.
const ROSTER_COLUMNS: Record<string, { label: string; value: (row: RosterRow) => string }> = {
  name: { label: 'Nome', value: (r) => r.name },
  isMember: { label: 'Membro', value: (r) => (r.isMember ? 'Sim' : 'Não') },
  phone: { label: 'Telefone', value: (r) => (r.phone ? formatPhone(r.phone) : '—') },
  email: { label: 'E-mail', value: (r) => r.email ?? '—' },
  city: { label: 'Cidade', value: (r) => formatCityState(r.city, r.state) },
  status: {
    label: 'Status',
    value: (r) => (r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : '—')
  },
  memberSince: {
    label: 'Membro desde',
    value: (r) => (r.memberSince != null ? formatMonthBR(r.memberSince) : '—')
  },
  admissionMode: { label: 'Modo de admissão', value: (r) => r.admissionMode ?? '—' },
  congregatingSince: {
    label: 'Congregando desde',
    value: (r) => (r.congregatingSince != null ? formatMonthBR(r.congregatingSince) : '—')
  },
  birthDate: {
    label: 'Nascimento',
    value: (r) => (r.birthDate ? formatDateBR(r.birthDate) : '—')
  },
  addressDistrict: { label: 'Bairro', value: (r) => r.addressDistrict ?? '—' },
  postalCode: { label: 'CEP', value: (r) => (r.postalCode ? formatCep(r.postalCode) : '—') }
};

const DEFAULT_ROSTER_COLUMNS = ['name', 'isMember', 'phone', 'city', 'status'];

function RosterPdf({
  rows,
  columnKeys,
  generatedAt,
  church,
  logo
}: {
  rows: RosterRow[];
  columnKeys: string[];
  generatedAt: string;
} & ChurchProps) {
  const cols = columnKeys.map((k) => ({ key: k, ...ROSTER_COLUMNS[k] }));
  return (
    <Document>
      <Page
        size="A4"
        orientation="landscape"
        style={tw('font-roboto p-8 pb-14 text-xs text-gray-900')}>
        <Letterhead church={church} logo={logo} />
        <PdfHeader title={`Congregados (${rows.length})`} generatedAt={generatedAt} />

        <View style={tw('flex-row border-b border-gray-400 pb-1 mb-1')}>
          {cols.map((c) => (
            <Text key={c.key} style={tw('flex-1 text-xs font-bold pr-2')}>
              {c.label}
            </Text>
          ))}
        </View>

        {rows.map((row) => (
          <View key={row.id} style={tw('flex-row border-b border-gray-200 py-1')} wrap={false}>
            {cols.map((c) => (
              <Text key={c.key} style={tw('flex-1 text-[9px] text-gray-700 pr-2')}>
                {c.value(row)}
              </Text>
            ))}
          </View>
        ))}
        <PageFooter churchName={church.name} />
      </Page>
    </Document>
  );
}

export async function renderAttendersRosterPdf(
  callerId: number,
  options: { columns?: string; filters?: AttenderFilters }
): Promise<{ buffer: Buffer; filename: string }> {
  const requested = (options.columns ?? '')
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c in ROSTER_COLUMNS);
  const columnKeys = requested.length ? requested : DEFAULT_ROSTER_COLUMNS;

  const rows = await listAttendersForExport(callerId, options.filters);

  const generatedAt = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const { church, logo } = await loadChurchForPdf();

  const element = React.createElement(RosterPdf, {
    rows,
    columnKeys,
    generatedAt,
    church,
    logo
  }) as React.ReactElement<DocumentProps>;

  const buffer = await renderToBuffer(element);
  return { buffer, filename: `congregados-${new Date().toISOString().slice(0, 10)}.pdf` };
}
