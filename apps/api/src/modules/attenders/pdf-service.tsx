import path from 'node:path';
import { createRequire } from 'node:module';
import React from 'react';
import {
  renderToBuffer,
  type DocumentProps,
  Document,
  Page,
  View,
  Text,
  Font
} from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';
import * as repo from './repository.js';
import {
  getAttenderDonationsSummary,
  getAttenderDonationsEntries,
  listAttendersForExport
} from './service.js';
import type {
  AttenderDonationsSummaryResponse,
  AttenderDonationsEntriesResponse,
  AttenderFilters
} from './schema.js';

// Resolve @fontsource via Node module resolution rather than a hardcoded relative path —
// the dev server runs from source (tsx) while prod runs from dist/, so a fixed `../..` chain
// points at the wrong depth in one of them. require.resolve walks node_modules in both.
const require = createRequire(import.meta.url);
const FONTSOURCE = path.dirname(path.dirname(require.resolve('@fontsource/roboto/package.json')));

Font.register({
  family: 'Roboto',
  fonts: [
    { src: path.join(FONTSOURCE, 'roboto/files/roboto-latin-400-normal.woff'), fontWeight: 400 },
    { src: path.join(FONTSOURCE, 'roboto/files/roboto-latin-700-normal.woff'), fontWeight: 700 }
  ]
});

const tw = createTw({
  fontFamily: { roboto: ['Roboto'] }
});

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

function groupLabel(
  categoryName: string,
  fundName: string | null,
  eventName: string | null
): string {
  const suffix = fundName ?? eventName;
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
  generatedAt
}: {
  attenderName: string;
  summary: AttenderDonationsSummaryResponse;
  generatedAt: string;
}) {
  return (
    <Document>
      <Page size="A4" style={tw('font-roboto p-10 text-xs text-gray-900')}>
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
                    {groupLabel(g.categoryName, g.fundName, g.eventName)}
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
      </Page>
    </Document>
  );
}

// Monthly receipt: per-transaction detail for one month.
function MonthDonationsPdf({
  attenderName,
  data,
  generatedAt
}: {
  attenderName: string;
  data: AttenderDonationsEntriesResponse;
  generatedAt: string;
}) {
  return (
    <Document>
      <Page size="A4" style={tw('font-roboto p-10 text-xs text-gray-900')}>
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
                  {groupLabel(e.categoryName, e.fundName, e.eventName)}
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

  let element: React.ReactElement<DocumentProps>;
  let suffix: string;

  if ('month' in scope) {
    const data = await getAttenderDonationsEntries(callerId, attenderId, scope.month);
    if (!data) return null;
    element = React.createElement(MonthDonationsPdf, {
      attenderName: attender.name,
      data,
      generatedAt
    }) as React.ReactElement<DocumentProps>;
    suffix = scope.month;
  } else {
    const summary = await getAttenderDonationsSummary(callerId, attenderId, scope.year);
    if (!summary) return null;
    element = React.createElement(YearDonationsPdf, {
      attenderName: attender.name,
      summary,
      generatedAt
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
  phone: { label: 'Telefone', value: (r) => r.phone ?? '—' },
  email: { label: 'E-mail', value: (r) => r.email ?? '—' },
  city: { label: 'Cidade', value: (r) => formatCityState(r.city, r.state) },
  status: {
    label: 'Status',
    value: (r) => (r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : '—')
  },
  memberSince: {
    label: 'Membro desde',
    value: (r) => (r.memberSince ? formatDateBR(r.memberSince) : '—')
  },
  admissionMode: { label: 'Modo de admissão', value: (r) => r.admissionMode ?? '—' },
  congregatingSinceYear: {
    label: 'Congregando desde',
    value: (r) => (r.congregatingSinceYear != null ? String(r.congregatingSinceYear) : '—')
  },
  birthDate: {
    label: 'Nascimento',
    value: (r) => (r.birthDate ? formatDateBR(r.birthDate) : '—')
  },
  addressDistrict: { label: 'Bairro', value: (r) => r.addressDistrict ?? '—' },
  postalCode: { label: 'CEP', value: (r) => r.postalCode ?? '—' }
};

const DEFAULT_ROSTER_COLUMNS = ['name', 'isMember', 'phone', 'city', 'status'];

function RosterPdf({
  rows,
  columnKeys,
  generatedAt
}: {
  rows: RosterRow[];
  columnKeys: string[];
  generatedAt: string;
}) {
  const cols = columnKeys.map((k) => ({ key: k, ...ROSTER_COLUMNS[k] }));
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={tw('font-roboto p-8 text-xs text-gray-900')}>
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

  const element = React.createElement(RosterPdf, {
    rows,
    columnKeys,
    generatedAt
  }) as React.ReactElement<DocumentProps>;

  const buffer = await renderToBuffer(element);
  return { buffer, filename: `congregados-${new Date().toISOString().slice(0, 10)}.pdf` };
}
