import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { PageContainer } from '@/components/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { DataTable } from '@/components/DataTable';
import { Pagination } from '@/components/Pagination';
import { RowDetailPanel, type RowDetailField } from '@/components/RowDetailPanel';
import { Button } from '@/components/Button';
import DateInput from '@/components/DateInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';
import { formatDateTime } from '@/lib/datetime';
import { useAudit, type AuditFilters } from './useAudit';
import {
  auditActionLabel,
  auditEntityLabel,
  AUDIT_ACTION_OPTIONS,
  AUDIT_ENTITY_OPTIONS,
  type AuditEntry
} from './schema';

const ALL = '__all__';
const LIMIT = 30;

function entityLabel(row: AuditEntry): string {
  const base = auditEntityLabel(row.entityType);
  return row.entityId !== null ? `${base} #${row.entityId}` : base;
}

function actorLabel(row: AuditEntry): string {
  // userId is nullable (FK SET NULL on a deleted actor); fall back to a stable label.
  return row.userName ?? (row.userId === null ? 'Sistema' : `Usuário #${row.userId}`);
}

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [detail, setDetail] = useState<AuditEntry | null>(null);

  const { data, isLoading } = useAudit(page, LIMIT, filters);
  const rows = data?.data ?? [];

  // Any filter change resets to page 1 so the user isn't stranded past the new last page.
  function setFilter(key: keyof AuditFilters, value: string | undefined) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  }

  const hasFilters = Object.values(filters).some(Boolean);

  const columns = useMemo<ColumnDef<AuditEntry, unknown>[]>(
    () => [
      {
        id: 'createdAt',
        header: 'Data/Hora',
        accessorFn: (row) => formatDateTime(row.createdAt)
      },
      { id: 'user', header: 'Usuário', accessorFn: actorLabel },
      {
        id: 'action',
        header: 'Ação',
        accessorFn: (row) => auditActionLabel(row.action)
      },
      { id: 'entity', header: 'Entidade', accessorFn: entityLabel },
      {
        id: 'notes',
        header: 'Detalhes',
        accessorFn: (row) => row.notes ?? '—'
      },
      {
        id: 'ipAddress',
        header: 'IP',
        accessorFn: (row) => row.ipAddress ?? '—'
      }
    ],
    []
  );

  const detailFields: RowDetailField[] = detail
    ? [
        { label: 'Data/Hora', value: formatDateTime(detail.createdAt) },
        { label: 'Usuário', value: actorLabel(detail) },
        { label: 'Ação', value: auditActionLabel(detail.action) },
        { label: 'Entidade', value: entityLabel(detail) },
        { label: 'Detalhes', value: detail.notes ?? '—' },
        { label: 'Endereço IP', value: detail.ipAddress ?? '—' }
      ]
    : [];

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle>Auditoria</CardTitle>
          <p className="text-sm text-muted-foreground">
            Registro de quem fez o quê — criações, edições, exclusões e mudanças de estado nas áreas
            sensíveis do sistema.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="audit-action">
                Ação
              </label>
              <Select
                value={filters.action ?? ALL}
                onValueChange={(v) => setFilter('action', v === ALL ? undefined : v)}>
                <SelectTrigger id="audit-action" aria-label="Filtrar por ação">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas</SelectItem>
                  {AUDIT_ACTION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="audit-entity">
                Entidade
              </label>
              <Select
                value={filters.entityType ?? ALL}
                onValueChange={(v) => setFilter('entityType', v === ALL ? undefined : v)}>
                <SelectTrigger id="audit-entity" aria-label="Filtrar por entidade">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas</SelectItem>
                  {AUDIT_ENTITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="audit-from">
                De
              </label>
              <DateInput
                id="audit-from"
                value={filters.from ?? ''}
                onChange={(e) => setFilter('from', e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="audit-to">
                Até
              </label>
              <DateInput
                id="audit-to"
                value={filters.to ?? ''}
                onChange={(e) => setFilter('to', e.target.value)}
              />
            </div>
          </div>

          {hasFilters && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilters({});
                  setPage(1);
                }}>
                Limpar filtros
              </Button>
            </div>
          )}

          <div className="-mx-4 sm:-mx-6">
            <DataTable
              columns={columns}
              data={rows}
              isLoading={isLoading}
              emptyMessage="Nenhum registro de auditoria encontrado."
              getRowKey={(row) => row.id}
              mobileRow={(row) => (
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{auditActionLabel(row.action)}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatDateTime(row.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">{entityLabel(row)}</p>
                  <p className="text-xs text-muted-foreground">{actorLabel(row)}</p>
                </div>
              )}
              mobileOnRowClick={setDetail}
              tableId="audit"
            />
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex justify-end">
              <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>

      <RowDetailPanel
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
        title="Detalhe do registro"
        fields={detailFields}
      />
    </PageContainer>
  );
}
