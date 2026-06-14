import { useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { PageContainer } from '@/components/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { RowActionButton } from '@/components/RowActionButton';
import { DataTable } from '@/components/DataTable';
import { Pagination } from '@/components/Pagination';
import { RowDetailPanel, type RowDetailField } from '@/components/RowDetailPanel';
import { DateRangeFilter } from '@/components/DateRangeFilter';
import { formatDateTime } from '@/lib/datetime';
import { useAudit, type AuditFilters } from './useAudit';
import {
  auditActionLabel,
  auditEntityLabel,
  auditFieldLabel,
  formatAuditValue,
  visibleAuditChanges,
  AUDIT_ACTION_OPTIONS,
  AUDIT_ENTITY_OPTIONS,
  type AuditEntry
} from './schema';

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

  // Per-column header filters (funnel menus) emit (columnId, value); the columnId matches the
  // AuditFilters key. Any filter change resets to page 1 so the user isn't stranded past the new
  // last page.
  function handleFilterChange(columnId: string, value: string | undefined) {
    setFilters((prev) => ({ ...prev, [columnId]: value || undefined }));
    setPage(1);
  }

  const columns = useMemo<ColumnDef<AuditEntry, unknown>[]>(
    () => [
      {
        id: 'createdAt',
        header: () => (
          <span className="flex items-center gap-1">
            Data/Hora
            <DateRangeFilter
              value={{ from: filters.from, to: filters.to }}
              onChange={(range) => {
                setFilters((prev) => ({ ...prev, from: range.from, to: range.to }));
                setPage(1);
              }}
            />
          </span>
        ),
        accessorFn: (row) => formatDateTime(row.createdAt)
      },
      { id: 'user', header: 'Usuário', accessorFn: actorLabel },
      {
        id: 'action',
        header: 'Tipo',
        accessorFn: (row) => auditActionLabel(row.action),
        meta: { filter: { options: AUDIT_ACTION_OPTIONS, allLabel: 'Todas' } }
      },
      {
        id: 'entityType',
        header: 'Entidade',
        accessorFn: entityLabel,
        meta: { filter: { options: AUDIT_ENTITY_OPTIONS, allLabel: 'Todas' } }
      },
      {
        id: 'ipAddress',
        header: 'IP',
        accessorFn: (row) => row.ipAddress ?? '—'
      },
      {
        id: 'actions',
        header: 'Ações',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <RowActionButton
              label="Ver detalhes"
              icon={<Eye className="h-4 w-4" />}
              onClick={() => setDetail(row.original)}
            />
          </div>
        )
      }
    ],
    [filters.from, filters.to]
  );

  const changeEntries = detail?.changes ? visibleAuditChanges(detail.changes) : [];

  const detailFields: RowDetailField[] = detail
    ? [
        { label: 'Data/Hora', value: formatDateTime(detail.createdAt) },
        { label: 'Usuário', value: actorLabel(detail) },
        { label: 'Ação', value: auditActionLabel(detail.action) },
        { label: 'Entidade', value: entityLabel(detail) },
        { label: 'Detalhes', value: detail.notes ?? '—' },
        {
          label: 'Alterações',
          value:
            changeEntries.length > 0 ? (
              <ul className="space-y-1">
                {changeEntries.map(([field, change]) => (
                  <li key={field} className="text-sm">
                    <span className="text-muted-foreground">{auditFieldLabel(field)}: </span>
                    <span className="line-through opacity-70">
                      {formatAuditValue(change.from, field)}
                    </span>
                    {' → '}
                    <span>{formatAuditValue(change.to, field)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              '—'
            )
        },
        { label: 'Endereço IP', value: detail.ipAddress ?? '—' }
      ]
    : [];

  return (
    <PageContainer>
      <Card className="pb-0">
        <CardHeader>
          <CardTitle>Auditoria</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            emptyMessage="Nenhum registro de auditoria encontrado."
            getRowKey={(row) => row.id}
            filters={filters}
            onFilterChange={handleFilterChange}
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
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex justify-end">
          <Pagination currentPage={page} totalPages={data.totalPages} onPageChange={setPage} />
        </div>
      )}

      <RowDetailPanel
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
        title="Detalhe do registro"
        fields={detailFields}
      />
    </PageContainer>
  );
}
