import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardContent, CardHeaderRow, CardTitle } from '@/components/Card';
import { DataTable } from '@/components/DataTable';
import { RowDetailPanel } from '@/components/RowDetailPanel';
import { RowDetailFooterActions } from '../components/RowActions';
import {
  buildExpenseLineItemColumns,
  renderExpenseLineItemMobile,
  buildExpenseLineItemFields
} from '../reports/expense-line-item-display';
import type { ExpenseEntryResponse } from './schema';

const LATEST_LIMIT = 15;

// The report row exposes the campaign as `campaignName`; the entries response calls it
// `campaignName`. Normalize so the shared expense display can render both.
type Row = ExpenseEntryResponse & { campaignName: string | null };

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
  const latest: Row[] = [...data]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, LATEST_LIMIT)
    .map((r) => ({ ...r, campaignName: r.campaignName }));

  const [detail, setDetail] = useState<Row | null>(null);

  const columns = buildExpenseLineItemColumns<Row>({
    actions: {
      onView: setDetail,
      onEdit: canEdit ? onEdit : undefined,
      onDelete: canDelete ? onDelete : undefined
    }
  });

  return (
    <>
      <Card className="pb-0">
        <CardHeaderRow>
          <CardTitle className="text-primary-soft">Últimos lançamentos</CardTitle>
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
        </CardHeaderRow>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={latest}
            isLoading={isLoading}
            emptyMessage="Nenhum lançamento ainda."
            getRowKey={(row) => row.id}
            mobileRow={renderExpenseLineItemMobile}
            mobileOnRowClick={setDetail}
            columnToggle
            tableId="expense-entries"
          />
        </CardContent>
      </Card>
      <RowDetailPanel
        open={detail !== null}
        onOpenChange={(open) => !open && setDetail(null)}
        title="Detalhes do lançamento"
        fields={detail ? buildExpenseLineItemFields(detail) : []}
        actions={
          detail ? (
            <RowDetailFooterActions
              onEdit={
                canEdit
                  ? () => {
                      const row = detail;
                      setDetail(null);
                      onEdit(row);
                    }
                  : undefined
              }
              onDelete={
                canDelete
                  ? () => {
                      const row = detail;
                      setDetail(null);
                      onDelete(row);
                    }
                  : undefined
              }
            />
          ) : undefined
        }
      />
    </>
  );
}
