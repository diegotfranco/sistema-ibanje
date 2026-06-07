import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/Card';
import type { FinancialStatementResponse } from './schema';

const formatMoney = (s: string) =>
  `R$ ${Number.parseFloat(s).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmt = (n: number) =>
  `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface CategoryRow {
  parentCategoryName: string | null;
  categoryName: string;
  total: string;
}

interface ParentGroup {
  name: string;
  children: CategoryRow[];
  subtotal: number;
}

function groupByParent(rows: CategoryRow[]): ParentGroup[] {
  const map = new Map<string, CategoryRow[]>();
  for (const row of rows) {
    const key = row.parentCategoryName ?? 'Sem grupo';
    const list = map.get(key);
    if (list) {
      list.push(row);
    } else {
      map.set(key, [row]);
    }
  }
  const groups: ParentGroup[] = Array.from(map.entries()).map(([name, children]) => ({
    name,
    children,
    subtotal: children.reduce((sum, c) => sum + Number.parseFloat(c.total), 0)
  }));
  groups.sort((a, b) => {
    if (a.name === 'Sem grupo') return 1;
    if (b.name === 'Sem grupo') return -1;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
  return groups;
}

interface SectionProps {
  title: string;
  groups: ParentGroup[];
  total: string;
  totalColor: 'in' | 'out';
}

function StatementSection({ title, groups, total, totalColor }: SectionProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(groups.map((g) => g.name)));
  const toggle = (name: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <section aria-labelledby={`statement-${title.toLowerCase()}`} className="space-y-3">
      <h3
        id={`statement-${title.toLowerCase()}`}
        className="text-sm font-semibold uppercase tracking-wide text-primary-soft">
        {title}
      </h3>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground italic px-2">Sem lançamentos no período.</p>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => {
            const isExpanded = expanded.has(group.name);
            return (
              <div key={group.name} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggle(group.name)}
                  aria-expanded={isExpanded}
                  className="flex w-full items-baseline justify-between gap-3 rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer">
                  <span className="inline-flex items-center gap-1 text-sm font-medium">
                    {isExpanded ? (
                      <ChevronDown className="size-3" />
                    ) : (
                      <ChevronRight className="size-3" />
                    )}
                    {group.name}
                  </span>
                  <span className="font-mono tabular-nums whitespace-nowrap shrink-0 text-sm font-medium">
                    {fmt(group.subtotal)}
                  </span>
                </button>
                {isExpanded && (
                  <dl className="space-y-0.5">
                    {group.children.map((child) => (
                      <div
                        key={child.categoryName}
                        className="flex items-baseline justify-between gap-3 pl-5 text-sm text-muted-foreground">
                        <dt className="min-w-0 truncate">{child.categoryName}</dt>
                        <dd className="font-mono tabular-nums shrink-0">
                          {formatMoney(child.total)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="flex items-baseline justify-between gap-3 border-t pt-2 text-sm font-semibold">
        <span className="min-w-0">Total {title}</span>
        <span
          className={`font-mono tabular-nums whitespace-nowrap shrink-0 ${totalColor === 'in' ? 'text-money-in' : 'text-money-out'}`}>
          {formatMoney(total)}
        </span>
      </div>
    </section>
  );
}

interface Props {
  data: FinancialStatementResponse;
}

export function FinancialStatementDocument({ data }: Props) {
  const incomeGroups = groupByParent(data.incomeByCategory);
  const expenseGroups = groupByParent(data.expensesByCategory);
  const result = Number.parseFloat(data.totalIncome) - Number.parseFloat(data.totalExpenses);
  const resultColor =
    result > 0 ? 'text-money-in' : result < 0 ? 'text-money-out' : 'text-foreground';

  return (
    <div className="space-y-6">
      <Card className="gap-0 pt-0.5 pb-0">
        <CardContent className="space-y-2 py-4 pb-2.5">
          <StatementSection
            title="Entradas"
            groups={incomeGroups}
            total={data.totalIncome}
            totalColor="in"
          />
          <div className="mt-4">
            <StatementSection
              title="Saídas"
              groups={expenseGroups}
              total={data.totalExpenses}
              totalColor="out"
            />
          </div>
          <div className="border-t pt-2 flex items-baseline justify-between gap-3 text-sm font-semibold">
            <span className="min-w-0">Resultado do mês</span>
            <span className={`font-mono tabular-nums whitespace-nowrap shrink-0 ${resultColor}`}>
              {fmt(result)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
