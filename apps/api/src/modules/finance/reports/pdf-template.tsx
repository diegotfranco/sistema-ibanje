import path from 'node:path';
import { Fragment } from 'react';
import { Document, Page, View, Text, Font } from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';
import { brandColors } from '@sistema-ibanje/shared/colors';
import type {
  FinancialStatementResponse,
  DetailedFinancialStatementResponse,
  IncomeByCategoryRow,
  ExpenseByCategoryRow,
  IncomePivot,
  IncomePivotColumn,
  IncomePivotRow,
  ExpenseReportRow
} from './schema.js';

const FONTSOURCE = path.resolve(import.meta.dirname, '../../../../node_modules/@fontsource');

Font.register({
  family: 'Roboto',
  fonts: [
    { src: path.join(FONTSOURCE, 'roboto/files/roboto-latin-100-normal.woff'), fontWeight: 100 }, // font-thin
    { src: path.join(FONTSOURCE, 'roboto/files/roboto-latin-200-normal.woff'), fontWeight: 200 }, // font-extralight
    { src: path.join(FONTSOURCE, 'roboto/files/roboto-latin-300-normal.woff'), fontWeight: 300 }, // font-light
    { src: path.join(FONTSOURCE, 'roboto/files/roboto-latin-400-normal.woff'), fontWeight: 400 }, // font-normal
    { src: path.join(FONTSOURCE, 'roboto/files/roboto-latin-500-normal.woff'), fontWeight: 500 }, // font-medium
    { src: path.join(FONTSOURCE, 'roboto/files/roboto-latin-600-normal.woff'), fontWeight: 600 }, // font-semibold
    { src: path.join(FONTSOURCE, 'roboto/files/roboto-latin-700-normal.woff'), fontWeight: 700 }, // font-bold
    { src: path.join(FONTSOURCE, 'roboto/files/roboto-latin-800-normal.woff'), fontWeight: 800 }, // font-extrabold
    { src: path.join(FONTSOURCE, 'roboto/files/roboto-latin-900-normal.woff'), fontWeight: 900 } // font-black
  ]
});

Font.register({
  family: 'NotoSans',
  fonts: [
    {
      src: path.join(FONTSOURCE, 'noto-sans/files/noto-sans-latin-100-normal.woff'),
      fontWeight: 100
    }, // font-thin
    {
      src: path.join(FONTSOURCE, 'noto-sans/files/noto-sans-latin-200-normal.woff'),
      fontWeight: 200
    }, // font-extralight
    {
      src: path.join(FONTSOURCE, 'noto-sans/files/noto-sans-latin-300-normal.woff'),
      fontWeight: 300
    }, // font-light
    {
      src: path.join(FONTSOURCE, 'noto-sans/files/noto-sans-latin-400-normal.woff'),
      fontWeight: 400
    }, // font-normal
    {
      src: path.join(FONTSOURCE, 'noto-sans/files/noto-sans-latin-500-normal.woff'),
      fontWeight: 500
    }, // font-medium
    {
      src: path.join(FONTSOURCE, 'noto-sans/files/noto-sans-latin-600-normal.woff'),
      fontWeight: 600
    }, // font-semibold
    {
      src: path.join(FONTSOURCE, 'noto-sans/files/noto-sans-latin-700-normal.woff'),
      fontWeight: 700
    }, // font-bold
    {
      src: path.join(FONTSOURCE, 'noto-sans/files/noto-sans-latin-800-normal.woff'),
      fontWeight: 800
    }, // font-extrabold
    {
      src: path.join(FONTSOURCE, 'noto-sans/files/noto-sans-latin-900-normal.woff'),
      fontWeight: 900
    } // font-black
  ]
});

const tw = createTw({
  colors: {
    brand: {
      primary: brandColors.primary.hex,
      soft: brandColors.primarySoftLight.hex,
      fg: brandColors.primaryForeground.hex
    } as unknown as Record<number, string>
  },
  fontFamily: {
    roboto: ['Roboto'],
    noto: ['NotoSans']
  }
});

type CatRow = IncomeByCategoryRow | ExpenseByCategoryRow;

interface CategoryTableProps {
  rows: CatRow[];
  totalLabel: string;
  type: 'income' | 'expense';
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function fmtCurrency(v: string): string {
  return Number.parseFloat(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getBalanceStyle(amount: string) {
  const value = Number.parseFloat(amount);
  return value >= 0
    ? tw('text-sm font-roboto font-medium text-green-800')
    : tw('text-sm font-roboto font-medium text-red-800');
}

const SIGNATORIES = [
  { role: 'Tesoureiro' },
  { role: 'Presidente' },
  { role: 'Contador' },
  { role: 'Relator da Comissão de Exame de Contas' }
] as const;

function PageHeader({
  period,
  title = 'Relatório de Fechamento Simples'
}: {
  period: { from: string; to: string };
  title?: string;
}) {
  return (
    <View style={tw('px-8 pb-6 mb-6 border-b border-gray-200')}>
      <View style={tw('flex-row justify-between items-end mb-2')}>
        <View>
          <Text style={tw('text-sm font-roboto font-bold text-brand-primary tracking-widest mb-1')}>
            IGREJA BATISTA NOVA JERUSALÉM
          </Text>
          <Text
            style={tw('text-3xl font-roboto font-bold text-slate-800 tracking-tight leading-none')}>
            {title}
          </Text>
        </View>

        <View style={tw('bg-slate-50 border border-gray-200 rounded px-3 py-2')}>
          <Text
            style={tw(
              'text-[0.625rem] leading-tight font-roboto font-bold text-zinc-600 tracking-widest mb-0.5'
            )}>
            PERÍODO DE APURAÇÃO
          </Text>
          <Text style={tw('text-xs font-roboto font-bold text-slate-700')}>
            {fmtDate(period.from)} – {fmtDate(period.to)}
          </Text>
        </View>
      </View>
    </View>
  );
}

function PageFooter() {
  return (
    <View
      style={tw(
        'absolute bottom-5 left-8 right-8 flex-row justify-between pt-1 border-t border-gray-200'
      )}
      fixed>
      <Text style={tw('text-[0.625rem] text-gray-500')}>
        Gerado em {new Date().toLocaleDateString('pt-BR')} · Igreja Batista Nova Jerusalém
      </Text>
      <Text
        style={tw('text-[0.625rem] text-gray-500')}
        render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
}

function CategoryTable({ rows, totalLabel, type }: CategoryTableProps) {
  const total = rows.reduce((sum, r) => sum + Number.parseFloat(r.total), 0).toFixed(2);
  return (
    <View>
      <View style={tw('flex-row bg-gray-100 border-b border-gray-200')}>
        <Text style={[tw('px-2 py-1.5 text-xs font-roboto font-medium'), { flex: 2 }]}>Grupo</Text>
        <Text style={[tw('px-2 py-1.5 text-xs font-roboto font-medium'), { flex: 3 }]}>
          Categoria
        </Text>
        <Text style={[tw('px-2 py-1.5 text-xs font-roboto font-medium text-right'), { flex: 1 }]}>
          Total
        </Text>
      </View>

      {rows.map((r, i, a) => {
        const borderClasses = i === a.length - 1 ? '' : 'border-b border-slate-200';
        const bgClasses = i % 2 === 0 ? '' : 'bg-slate-50';
        const rowClasses = ['flex-row', borderClasses, bgClasses].filter(Boolean).join(' ');
        return (
          <View key={r.categoryId} style={tw(rowClasses)}>
            <Text style={[tw('px-2 py-1.5 text-xs text-slate-700'), { flex: 2 }]}>
              {r.parentCategoryName ?? '—'}
            </Text>
            <Text style={[tw('px-2 py-1.5 text-xs text-slate-700'), { flex: 3 }]}>
              {r.categoryName}
            </Text>
            <Text style={[tw('px-2 py-1.5 text-xs text-slate-700 text-right'), { flex: 1 }]}>
              {fmtCurrency(r.total)}
            </Text>
          </View>
        );
      })}

      <View
        style={tw(
          type === 'income'
            ? 'flex-row bg-emerald-50 border-t border-green-200'
            : 'flex-row bg-red-50 border-t border-red-100'
        )}>
        <Text
          style={[
            tw(
              type === 'income'
                ? 'px-2 py-1.5 text-xs font-medium font-roboto text-green-900'
                : 'px-2 py-1.5 text-xs font-medium font-roboto text-red-900'
            ),
            { flex: 5 }
          ]}>
          {totalLabel}
        </Text>
        <Text
          style={[
            tw(
              type === 'income'
                ? 'px-2 py-1.5 text-xs font-medium font-roboto text-right text-green-900'
                : 'px-2 py-1 text-xs font-medium font-roboto text-right text-red-900'
            ),
            { flex: 2 }
          ]}>
          {fmtCurrency(total)}
        </Text>
      </View>
    </View>
  );
}

function SummaryCards({
  openingBalance,
  totalIncome,
  totalExpenses,
  currentBalance
}: {
  openingBalance: string;
  totalIncome: string;
  totalExpenses: string;
  currentBalance: string;
}) {
  return (
    <View style={tw('flex-row mb-5')}>
      <View style={tw('flex-1 border border-slate-200 rounded p-2.5 mr-2')}>
        <Text style={tw('text-xs font-roboto font-medium mb-1')}>SALDO ABERTURA</Text>
        <Text style={getBalanceStyle(openingBalance)}>{fmtCurrency(openingBalance)}</Text>
      </View>
      <View style={tw('flex-1 border border-slate-200 rounded p-2.5 mr-2')}>
        <Text style={tw('text-xs font-roboto font-medium mb-1')}>TOTAL ENTRADAS</Text>
        <Text style={tw('text-sm font-roboto text-slate-700 font-medium')}>
          {fmtCurrency(totalIncome)}
        </Text>
      </View>
      <View style={tw('flex-1 border border-slate-200 rounded p-2.5 mr-2')}>
        <Text style={tw('text-xs font-roboto font-medium mb-1')}>TOTAL SAÍDAS</Text>
        <Text style={tw('text-sm font-roboto text-slate-700 font-medium')}>
          {fmtCurrency(totalExpenses)}
        </Text>
      </View>
      <View style={tw('flex-1 border border-slate-200 rounded p-2.5')}>
        <Text style={tw('text-xs font-roboto font-medium mb-1')}>SALDO FECHAMENTO</Text>
        <Text style={getBalanceStyle(currentBalance)}>{fmtCurrency(currentBalance)}</Text>
      </View>
    </View>
  );
}

function SignatureBlock() {
  return (
    <View wrap={false} style={tw('px-8 mt-auto')}>
      <View style={tw('flex-row flex-wrap justify-between mb-9')}>
        {SIGNATORIES.map(({ role }) => (
          <View key={role} style={tw('w-[45%] mt-11 px-4')}>
            <View style={tw('h-10')} />
            <View style={tw('mb-1.5 border-t border-zinc-600')} />
            <Text style={tw('text-xs font-roboto font-medium text-center')}>{role}</Text>
          </View>
        ))}
      </View>
      <Text style={tw('text-xs text-gray-500 leading-normal')}>
        Declaramos que os presentes demonstrativos financeiros foram examinados e estão em
        conformidade com os registros contábeis da Igreja Batista Nova Jerusalém referentes ao
        período indicado.
      </Text>
    </View>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={tw('flex-row items-center mb-2')}>
      <View style={tw('w-1 min-h-3.5 rounded-sm bg-brand-primary mr-2')} />
      <Text style={tw('text-sm font-roboto font-semibold text-brand-primary')}>{label}</Text>
    </View>
  );
}

interface PivotBucket {
  key: string;
  label: string;
  columns: IncomePivotColumn[];
}

function bucketPivotColumns(columns: IncomePivotColumn[]): PivotBucket[] {
  const buckets = new Map<string, PivotBucket>();
  for (const col of columns) {
    const existing = buckets.get(col.groupKey);
    if (existing) existing.columns.push(col);
    else
      buckets.set(col.groupKey, {
        key: col.groupKey,
        label: col.groupLabel,
        columns: [col]
      });
  }
  return [...buckets.values()];
}

function sumPivotCells(row: IncomePivotRow, cols: IncomePivotColumn[]): number {
  let total = 0;
  for (const c of cols) {
    const v = row.cells[c.key];
    if (v) total += parseFloat(v);
  }
  return total;
}

function bucketDisplayLabel(bucket: PivotBucket): string {
  if (bucket.columns.length === 1 && bucket.key === 'doacao') {
    return `${bucket.label} · ${bucket.columns[0].label}`;
  }
  return bucket.label;
}

function IncomePivotTable({ pivot }: { pivot: IncomePivot }) {
  const buckets = bucketPivotColumns(pivot.columns);
  const labelFlex = 5;
  const valueFlex = 1.5;
  return (
    <View>
      {pivot.rows.map((row, rowIdx) => (
        <View key={row.referenceDate} wrap={false}>
          <View
            style={tw(
              ['flex-row bg-gray-100', rowIdx > 0 ? 'border-t border-gray-200' : '']
                .filter(Boolean)
                .join(' ')
            )}>
            <Text
              style={[
                tw('px-2 py-1.5 text-xs font-roboto font-medium text-slate-700'),
                { flex: labelFlex }
              ]}>
              {fmtDate(row.referenceDate)}
            </Text>
            <Text
              style={[
                tw('px-2 py-1.5 text-xs font-roboto font-medium text-right text-slate-700'),
                { flex: valueFlex }
              ]}>
              {fmtCurrency(row.total)}
            </Text>
          </View>
          {buckets.map((bucket) => {
            const bucketSum = sumPivotCells(row, bucket.columns);
            if (bucketSum === 0) return null;
            const expandable = bucket.columns.length > 1;
            if (!expandable) {
              return (
                <View
                  key={`${row.referenceDate}:${bucket.key}`}
                  style={tw('flex-row border-b border-slate-100')}>
                  <Text style={[tw('px-2 py-1 pl-5 text-xs text-slate-700'), { flex: labelFlex }]}>
                    {bucketDisplayLabel(bucket)}
                  </Text>
                  <Text
                    style={[
                      tw('px-2 py-1 text-xs text-slate-700 text-right'),
                      { flex: valueFlex }
                    ]}>
                    {fmtCurrency(bucketSum.toFixed(2))}
                  </Text>
                </View>
              );
            }
            return (
              <Fragment key={`${row.referenceDate}:${bucket.key}`}>
                <View style={tw('flex-row border-b border-slate-100')}>
                  <Text style={[tw('px-2 py-1 pl-5 text-xs text-slate-700'), { flex: labelFlex }]}>
                    {bucket.label}
                  </Text>
                  <Text
                    style={[
                      tw('px-2 py-1 text-xs text-slate-700 text-right'),
                      { flex: valueFlex }
                    ]}>
                    {fmtCurrency(bucketSum.toFixed(2))}
                  </Text>
                </View>
                {bucket.columns
                  .filter((col) => row.cells[col.key])
                  .map((col) => (
                    <View
                      key={`${row.referenceDate}:${col.key}`}
                      style={tw('flex-row border-b border-slate-100')}>
                      <Text
                        style={[
                          tw('px-2 py-1 pl-9 text-[0.6875rem] text-slate-500'),
                          { flex: labelFlex }
                        ]}>
                        · {col.label}
                      </Text>
                      <Text
                        style={[
                          tw('px-2 py-1 text-[0.6875rem] text-slate-500 text-right'),
                          { flex: valueFlex }
                        ]}>
                        {fmtCurrency(row.cells[col.key])}
                      </Text>
                    </View>
                  ))}
              </Fragment>
            );
          })}
        </View>
      ))}
      <View style={tw('flex-row bg-green-50 border-t border-green-100')}>
        <Text
          style={[
            tw('px-2 py-1.5 text-xs font-medium font-roboto text-green-900'),
            { flex: labelFlex }
          ]}>
          Total do período
        </Text>
        <Text
          style={[
            tw('px-2 py-1.5 text-xs font-medium font-roboto text-right text-green-900'),
            { flex: valueFlex }
          ]}>
          {fmtCurrency(pivot.grandTotal)}
        </Text>
      </View>
    </View>
  );
}

function ExpenseDetailTable({ rows }: { rows: ExpenseReportRow[] }) {
  const total = rows.reduce((s, r) => s + Number.parseFloat(r.amount), 0).toFixed(2);
  return (
    <View>
      <View style={tw('flex-row bg-gray-100 border-b border-gray-200')}>
        <Text style={[tw('px-2 py-1.5 text-xs font-roboto font-medium'), { flex: 0.9 }]}>Data</Text>
        <Text style={[tw('px-2 py-1.5 text-xs font-roboto font-medium'), { flex: 2 }]}>Grupo</Text>
        <Text style={[tw('px-2 py-1.5 text-xs font-roboto font-medium'), { flex: 7 }]}>
          Categoria
        </Text>
        <Text style={[tw('px-2 py-1.5 text-xs font-roboto font-medium text-right'), { flex: 1.1 }]}>
          Valor
        </Text>
      </View>
      {rows.map((r, i, a) => {
        const border = i < a.length - 1 ? 'border-b border-slate-200' : '';
        const bg = i % 2 !== 0 ? 'bg-slate-50' : '';
        return (
          <View
            key={r.id}
            wrap={false}
            style={tw(['flex-row', border, bg].filter(Boolean).join(' '))}>
            <Text style={[tw('px-2 py-1.5 text-xs text-slate-700'), { flex: 0.9 }]}>
              {fmtDate(r.date)}
            </Text>
            <Text style={[tw('px-2 py-1.5 text-xs text-slate-700'), { flex: 2 }]}>
              {r.parentCategoryName ?? '—'}
            </Text>
            <Text style={[tw('px-2 py-1.5 text-xs text-slate-700'), { flex: 7 }]}>
              {r.categoryName}
            </Text>
            <Text style={[tw('px-2 py-1.5 text-xs text-slate-700 text-right'), { flex: 1.1 }]}>
              {fmtCurrency(r.amount)}
            </Text>
          </View>
        );
      })}
      <View style={tw('flex-row bg-red-50 border-t border-red-100')}>
        <Text
          style={[tw('px-2 py-1.5 text-xs font-medium font-roboto text-red-900'), { flex: 9.9 }]}>
          Total
        </Text>
        <Text
          style={[
            tw('px-2 py-1.5 text-xs font-medium font-roboto text-right text-red-900'),
            { flex: 1.1 }
          ]}>
          {fmtCurrency(total)}
        </Text>
      </View>
    </View>
  );
}

export function DetailedFinancialStatementPdf({
  data
}: {
  data: DetailedFinancialStatementResponse;
}) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={tw('font-noto text-zinc-600 pt-8 pb-14')}>
        <PageHeader period={data.period} title="Relatório de Fechamento Detalhado" />
        <View style={tw('px-8')}>
          <SummaryCards
            openingBalance={data.openingBalance}
            totalIncome={data.totalIncome}
            totalExpenses={data.totalExpenses}
            currentBalance={data.currentBalance}
          />
          <View style={tw('mb-6')}>
            <SectionHeader label="Entradas" />
            <IncomePivotTable pivot={data.incomePivot} />
          </View>
          <View style={tw('mb-6')}>
            <SectionHeader label="Saídas" />
            <ExpenseDetailTable rows={data.expenseEntries} />
          </View>
        </View>
        <SignatureBlock />
        <PageFooter />
      </Page>
    </Document>
  );
}

export function FinancialStatementPdf({ data }: { data: FinancialStatementResponse }) {
  return (
    <Document>
      <Page size="A4" style={tw('font-noto text-zinc-600 pt-8 pb-14')}>
        <PageHeader period={data.period} />

        <View style={tw('px-8')}>
          <SummaryCards
            openingBalance={data.openingBalance}
            totalIncome={data.totalIncome}
            totalExpenses={data.totalExpenses}
            currentBalance={data.currentBalance}
          />
          <View style={tw('mb-6')}>
            <SectionHeader label="Entradas" />
            <CategoryTable rows={data.incomeByCategory} totalLabel="Total" type="income" />
          </View>
          <View style={tw('mb-6')}>
            <SectionHeader label="Saídas" />
            <CategoryTable rows={data.expensesByCategory} totalLabel="Total" type="expense" />
          </View>
        </View>
        <SignatureBlock />
        <PageFooter />
      </Page>
    </Document>
  );
}
