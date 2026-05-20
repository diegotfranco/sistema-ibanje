import { Link } from 'react-router';
import { Edit, Trash2, Receipt, ArrowRight } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { DataTable } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { formatDate, formatMoney } from '../entries-utils';
import type { ExpenseEntryResponse } from './schema';
import type { ColumnDef } from '@tanstack/react-table';

const LATEST_LIMIT = 10;

interface Props {
  data: ExpenseEntryResponse[];
  isLoading: boolean;
  onEdit: (row: ExpenseEntryResponse) => void;
  onDelete: (row: ExpenseEntryResponse) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function ExpenseEntriesTable({
  data,
  isLoading,
  onEdit,
  onDelete,
  canEdit,
  canDelete
}: Props) {
  const latest = [...data]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, LATEST_LIMIT);

  const columns: ColumnDef<ExpenseEntryResponse, unknown>[] = [
    {
      id: 'date',
      header: 'Data',
      cell: (info) => (
        <span className="tabular-nums">{formatDate(info.row.original.referenceDate)}</span>
      ),
      meta: {}
    },
    {
      id: 'group',
      header: 'Grupo',
      cell: (info) => info.row.original.parentCategoryName ?? '—',
      meta: { hideBelow: 'lg' }
    },
    {
      id: 'category',
      header: 'Categoria',
      cell: (info) => info.row.original.categoryName,
      meta: { className: 'w-full' }
    },
    {
      id: 'designatedFund',
      header: 'Fundo',
      cell: (info) => info.row.original.designatedFundName ?? '—',
      meta: { hideBelow: 'xl' }
    },
    {
      id: 'sponsor',
      header: 'Patrocinador',
      cell: (info) => info.row.original.attenderName ?? '—',
      meta: { hideBelow: 'xl' }
    },
    {
      id: 'description',
      header: 'Descrição',
      cell: (info) => (
        <span
          title={info.row.original.description}
          className="block max-w-full truncate text-muted-foreground">
          {info.row.original.description}
        </span>
      ),
      meta: { hideBelow: 'md', className: 'max-w-64' }
    },
    {
      id: 'paymentMethod',
      header: 'Forma de Pag.',
      cell: (info) => info.row.original.paymentMethodName,
      meta: { hideBelow: 'lg' }
    },
    {
      id: 'installment',
      header: 'Parcela',
      cell: (info) =>
        info.row.original.totalInstallments > 1
          ? `${info.row.original.installment}/${info.row.original.totalInstallments}`
          : '—',
      meta: { hideBelow: 'lg', align: 'center' }
    },
    {
      id: 'amount',
      header: 'Valor',
      cell: (info) => (
        <span className="font-mono tabular-nums">R$ {formatMoney(info.row.original.amount)}</span>
      ),
      meta: { align: 'right' }
    },
    {
      id: 'status',
      header: 'Status',
      cell: (info) => <StatusBadge status={info.row.original.status} />,
      meta: { hideBelow: 'md' }
    },
    {
      id: 'receipt',
      header: 'Comprovante',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex justify-center">
            {row.hasReceipt ? (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={`${import.meta.env.VITE_API_URL || '/api'}/expense-entries/${row.id}/receipt`}
                title="Ver comprovante"
                aria-label="Ver comprovante"
                className="text-primary hover:text-primary-soft inline-flex">
                <Receipt size={16} />
              </a>
            ) : (
              <span
                role="img"
                aria-label="Sem comprovante"
                title="Sem comprovante"
                className="text-muted-foreground/40 inline-flex">
                <Receipt size={16} />
              </span>
            )}
          </div>
        );
      },
      meta: { hideBelow: 'xl', align: 'center' }
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex justify-end gap-2">
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(row)}
                title="Editar"
                aria-label="Editar">
                <Edit size={16} />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(row)}
                title="Remover"
                aria-label="Remover">
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        );
      },
      meta: { align: 'right' }
    }
  ];

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle className="flex items-center text-primary-soft justify-between">
          <span>Últimos lançamentos</span>
          <Button
            asChild
            variant="link"
            size="sm"
            className="text-muted-foreground hover:text-primary-soft">
            <Link to="/reports?tab=expenses" className="inline-flex items-center gap-1">
              Ver todos
              <ArrowRight size={14} />
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <DataTable
          columns={columns}
          data={latest}
          isLoading={isLoading}
          emptyMessage="Nenhum lançamento ainda."
          getRowKey={(row) => row.id}
        />
      </CardContent>
    </Card>
  );
}
