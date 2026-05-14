import path from 'path';
import { Document, Page, View, Text, Font } from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';
import type {
  FinancialStatementResponse,
  DetailedFinancialStatementResponse,
  IncomeByCategoryRow,
  ExpenseByCategoryRow,
  ExpenseReportRow,
  IncomePivot
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
    <View style={tw('px-8 pt-8 pb-6 mb-6 border-b border-gray-200')}>
      <View style={tw('flex-row justify-between items-end mb-2')}>
        <View>
          <Text style={tw('text-sm font-roboto font-bold text-teal-700 tracking-widest mb-1')}>
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
                ? 'px-2 py-1.5 text-xs font-medium font-roboto text-teal-900'
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
                ? 'px-2 py-1.5 text-xs font-medium font-roboto text-right text-teal-900'
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
      <View style={tw('w-1 min-h-3.5 rounded-sm bg-teal-700 mr-2')} />
      <Text style={tw('text-sm font-roboto font-semibold text-teal-900')}>{label}</Text>
    </View>
  );
}

function IncomeDetailTable({ pivot }: { pivot: IncomePivot }) {
  const dateColFlex = 0.9;
  const valColFlex = 2;
  const totalColFlex = 1.1;

  return (
    <View>
      <View style={tw('flex-row bg-gray-100 border-b border-gray-200')}>
        <Text style={[tw('px-2 py-1.5 text-xs font-roboto font-medium'), { flex: dateColFlex }]}>
          Data
        </Text>
        {pivot.columns.map((col) => (
          <Text
            key={col.key}
            style={[
              tw('px-2 py-1.5 text-xs font-roboto font-medium text-right'),
              { flex: valColFlex }
            ]}>
            {col.label}
          </Text>
        ))}
        <Text
          style={[
            tw('px-2 py-1.5 text-xs font-roboto font-medium text-right'),
            { flex: totalColFlex }
          ]}>
          Total
        </Text>
      </View>

      {pivot.rows.map((row, i) => {
        const border = i < pivot.rows.length - 1 ? 'border-b border-slate-200' : '';
        const bg = i % 2 !== 0 ? 'bg-slate-50' : '';
        return (
          <View
            key={row.referenceDate}
            style={tw(['flex-row', border, bg].filter(Boolean).join(' '))}>
            <Text style={[tw('px-2 py-1.5 text-xs text-slate-700'), { flex: dateColFlex }]}>
              {fmtDate(row.referenceDate)}
            </Text>
            {pivot.columns.map((col) => (
              <Text
                key={col.key}
                style={[tw('px-2 py-1.5 text-xs text-slate-700 text-right'), { flex: valColFlex }]}>
                {fmtCurrency(row.cells[col.key] ?? '0.00')}
              </Text>
            ))}
            <Text
              style={[
                tw('px-2 py-1.5 text-xs text-slate-700 font-medium text-right'),
                { flex: totalColFlex }
              ]}>
              {fmtCurrency(row.total)}
            </Text>
          </View>
        );
      })}

      <View style={tw('flex-row bg-emerald-50 border-t border-green-200')}>
        <Text
          style={[
            tw('px-2 py-1.5 text-xs font-medium font-roboto text-teal-900'),
            { flex: dateColFlex }
          ]}>
          Total
        </Text>
        {pivot.columns.map((col) => (
          <Text
            key={col.key}
            style={[
              tw('px-2 py-1.5 text-xs font-medium font-roboto text-right text-teal-900'),
              { flex: valColFlex }
            ]}>
            {fmtCurrency(col.total)}
          </Text>
        ))}
        <Text
          style={[
            tw('px-2 py-1.5 text-xs font-medium font-roboto text-right text-teal-900'),
            { flex: totalColFlex }
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
        <Text style={[tw('px-2 py-1.5 text-xs font-roboto font-medium'), { flex: 3 }]}>
          Categoria
        </Text>
        <Text style={[tw('px-2 py-1.5 text-xs font-roboto font-medium'), { flex: 4 }]}>
          Descrição
        </Text>
        <Text style={[tw('px-2 py-1.5 text-xs font-roboto font-medium text-right'), { flex: 1.1 }]}>
          Valor
        </Text>
      </View>
      {rows.map((r, i, a) => {
        const border = i < a.length - 1 ? 'border-b border-slate-200' : '';
        const bg = i % 2 !== 0 ? 'bg-slate-50' : '';
        return (
          <View key={r.id} style={tw(['flex-row', border, bg].filter(Boolean).join(' '))}>
            <Text style={[tw('px-2 py-1.5 text-xs text-slate-700'), { flex: 0.9 }]}>
              {fmtDate(r.referenceDate)}
            </Text>
            <Text style={[tw('px-2 py-1.5 text-xs text-slate-700'), { flex: 2 }]}>
              {r.parentCategoryName ?? '—'}
            </Text>
            <Text style={[tw('px-2 py-1.5 text-xs text-slate-700'), { flex: 3 }]}>
              {r.categoryName}
            </Text>
            <Text style={[tw('px-2 py-1.5 text-xs text-slate-700'), { flex: 4 }]}>
              {r.description}
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
      <Page size="A4" orientation="landscape" style={tw('font-noto text-zinc-600 pb-14')}>
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
            <IncomeDetailTable pivot={data.incomePivot} />
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
      <Page size="A4" style={tw('font-noto text-zinc-600 pb-14')}>
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
