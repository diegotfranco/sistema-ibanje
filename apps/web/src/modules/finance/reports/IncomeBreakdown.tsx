import { Fragment, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useIsAbove } from '@/hooks/useBreakpoint';
import { cn } from '@/lib/utils';
import { formatDate, formatMoney } from '../entries-utils';
import type { IncomePivot, IncomePivotColumn, IncomePivotRow } from './schema';

interface Bucket {
  key: string;
  label: string;
  columns: IncomePivotColumn[];
}

function bucketBy(columns: IncomePivotColumn[]): Bucket[] {
  const buckets = new Map<string, Bucket>();
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

function sumCells(row: IncomePivotRow, cols: IncomePivotColumn[]): number {
  let total = 0;
  for (const c of cols) {
    const v = row.cells[c.key];
    if (v) total += parseFloat(v);
  }
  return total;
}

interface ViewProps {
  pivot: IncomePivot;
  buckets: Bucket[];
  collapsed: Set<string>;
  toggle: (referenceDate: string) => void;
}

export function IncomeBreakdown({ pivot }: { pivot: IncomePivot }) {
  const isAboveMd = useIsAbove('md');
  const buckets = useMemo(() => bucketBy(pivot.columns), [pivot.columns]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (referenceDate: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(referenceDate)) next.delete(referenceDate);
      else next.add(referenceDate);
      return next;
    });

  if (pivot.rows.length === 0 || pivot.columns.length === 0) {
    return (
      <p className="text-sm text-muted-foreground px-4 py-8 text-center">
        Nenhuma entrada no período.
      </p>
    );
  }

  return isAboveMd ? (
    <IncomeBreakdownTable pivot={pivot} buckets={buckets} collapsed={collapsed} toggle={toggle} />
  ) : (
    <IncomeBreakdownCardsByDate
      pivot={pivot}
      buckets={buckets}
      collapsed={collapsed}
      toggle={toggle}
    />
  );
}

function bucketLabel(bucket: Bucket): string {
  if (bucket.columns.length === 1 && bucket.key === 'doacao') {
    return `${bucket.label} · ${bucket.columns[0].label}`;
  }
  return bucket.label;
}

// ─── md+ Table ───────────────────────────────────────────────────────────────

function IncomeBreakdownTable({ pivot, buckets, collapsed, toggle }: ViewProps) {
  return (
    <Table>
      <TableBody>
        {pivot.rows.map((row, rowIdx) => {
          const isCollapsed = collapsed.has(row.referenceDate);
          return (
            <Fragment key={row.referenceDate}>
              <TableRow className={cn(rowIdx > 0 && 'border-t-2')}>
                <TableCell className="font-semibold text-base py-3">
                  {formatDate(row.referenceDate)}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums font-semibold text-base text-money-in py-3 whitespace-nowrap">
                  R$ {formatMoney(row.total)}
                </TableCell>
              </TableRow>
              {buckets.map((bucket) => {
                const bucketSum = sumCells(row, bucket.columns);
                if (bucketSum === 0) return null;
                const expandable = bucket.columns.length > 1;
                if (!expandable) {
                  return (
                    <TableRow key={`${row.referenceDate}:${bucket.key}`}>
                      <TableCell className="pl-6 py-1.5">{bucketLabel(bucket)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums py-1.5 whitespace-nowrap">
                        R$ {formatMoney(bucketSum.toFixed(2))}
                      </TableCell>
                    </TableRow>
                  );
                }
                return (
                  <Fragment key={`${row.referenceDate}:${bucket.key}`}>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell className="pl-6 py-1.5">
                        <button
                          type="button"
                          aria-expanded={!isCollapsed}
                          onClick={() => toggle(row.referenceDate)}
                          className="inline-flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50 cursor-pointer">
                          {isCollapsed ? (
                            <ChevronRight className="size-3" />
                          ) : (
                            <ChevronDown className="size-3" />
                          )}
                          {bucket.label}
                        </button>
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums py-1.5 whitespace-nowrap">
                        R$ {formatMoney(bucketSum.toFixed(2))}
                      </TableCell>
                    </TableRow>
                    {!isCollapsed &&
                      bucket.columns
                        .filter((col) => row.cells[col.key])
                        .map((col) => (
                          <TableRow key={`${row.referenceDate}:${col.key}`}>
                            <TableCell className="pl-12 py-1 text-sm text-muted-foreground">
                              · {col.label}
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums py-1 text-sm text-muted-foreground whitespace-nowrap">
                              R$ {formatMoney(row.cells[col.key])}
                            </TableCell>
                          </TableRow>
                        ))}
                  </Fragment>
                );
              })}
            </Fragment>
          );
        })}
      </TableBody>
      <tfoot>
        <TableRow className="border-t-2 font-semibold">
          <TableCell className="py-3 text-base">Total do período</TableCell>
          <TableCell className="text-right font-mono tabular-nums text-money-in py-3 text-base whitespace-nowrap">
            R$ {formatMoney(pivot.grandTotal)}
          </TableCell>
        </TableRow>
      </tfoot>
    </Table>
  );
}

// ─── Mobile cards (<md) ──────────────────────────────────────────────────────

function IncomeBreakdownCardsByDate({ pivot, buckets, collapsed, toggle }: ViewProps) {
  return (
    <ul className="divide-y">
      {pivot.rows.map((row) => {
        const isCollapsed = collapsed.has(row.referenceDate);
        return (
          <li key={row.referenceDate} className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-base font-semibold tabular-nums">
                {formatDate(row.referenceDate)}
              </span>
              <span className="font-mono tabular-nums text-base font-bold whitespace-nowrap shrink-0 text-money-in">
                R$ {formatMoney(row.total)}
              </span>
            </div>
            <dl className="mt-1.5 space-y-0.5">
              {buckets.map((bucket) => {
                const bucketSum = sumCells(row, bucket.columns);
                if (bucketSum === 0) return null;
                const expandable = bucket.columns.length > 1;
                if (!expandable) {
                  return (
                    <div
                      key={`${row.referenceDate}:${bucket.key}`}
                      className="flex items-baseline justify-between gap-3 pl-3 text-xs text-muted-foreground">
                      <dt className="min-w-0 truncate">{bucketLabel(bucket)}</dt>
                      <dd className="font-mono tabular-nums whitespace-nowrap shrink-0">
                        R$ {formatMoney(bucketSum.toFixed(2))}
                      </dd>
                    </div>
                  );
                }
                return (
                  <Fragment key={`${row.referenceDate}:${bucket.key}`}>
                    <div className="flex items-baseline justify-between gap-3 pl-3 text-xs text-muted-foreground">
                      <dt className="min-w-0 truncate">
                        <button
                          type="button"
                          aria-expanded={!isCollapsed}
                          onClick={() => toggle(row.referenceDate)}
                          className="inline-flex items-center gap-1 hover:text-foreground">
                          {isCollapsed ? (
                            <ChevronRight className="size-3" />
                          ) : (
                            <ChevronDown className="size-3" />
                          )}
                          {bucket.label}
                        </button>
                      </dt>
                      <dd className="font-mono tabular-nums whitespace-nowrap shrink-0">
                        R$ {formatMoney(bucketSum.toFixed(2))}
                      </dd>
                    </div>
                    {!isCollapsed &&
                      bucket.columns
                        .filter((col) => row.cells[col.key])
                        .map((col) => (
                          <div
                            key={`${row.referenceDate}:${col.key}`}
                            className="flex items-baseline justify-between gap-3 pl-9 text-xs text-muted-foreground/80">
                            <dt className="min-w-0 truncate">· {col.label}</dt>
                            <dd className="font-mono tabular-nums whitespace-nowrap shrink-0">
                              R$ {formatMoney(row.cells[col.key])}
                            </dd>
                          </div>
                        ))}
                  </Fragment>
                );
              })}
            </dl>
          </li>
        );
      })}
      <li className="border-t-2 px-4 py-3 flex items-baseline justify-between gap-3 text-base font-semibold">
        <span>Total do período</span>
        <span className="font-mono tabular-nums whitespace-nowrap shrink-0 text-money-in">
          R$ {formatMoney(pivot.grandTotal)}
        </span>
      </li>
    </ul>
  );
}
