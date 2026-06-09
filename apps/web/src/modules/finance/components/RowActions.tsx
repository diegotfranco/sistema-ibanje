import type { ColumnDef } from '@tanstack/react-table';
import { Edit, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';

/**
 * Per-row callbacks shared by the finance line-item displays. Each handler is
 * optional; a handler's absence hides its button, so callers express
 * permissions simply by omitting the callback. Bound to a row `T` by the
 * column builders.
 */
export interface LineItemActions<T> {
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

interface RowActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * The ghost icon buttons (view / edit / remove) rendered inside a DataTable
 * "Ações" column cell. A button renders only when its handler is supplied.
 */
export function RowActionButtons({ onView, onEdit, onDelete }: RowActionButtonsProps) {
  return (
    <div className="flex justify-end gap-2">
      {onView && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onView}
          title="Ver detalhes"
          aria-label="Ver detalhes">
          <Eye size={16} />
        </Button>
      )}
      {onEdit && (
        <Button variant="ghost" size="sm" onClick={onEdit} title="Editar" aria-label="Editar">
          <Edit size={16} />
        </Button>
      )}
      {onDelete && (
        <Button variant="ghost" size="sm" onClick={onDelete} title="Remover" aria-label="Remover">
          <Trash2 size={16} />
        </Button>
      )}
    </div>
  );
}

/**
 * Builds the trailing "Ações" column for a finance line-item table, wiring each
 * row to the supplied {@link LineItemActions}. Returns `null` when no handler is
 * provided so the column can be conditionally appended.
 */
export function lineItemActionsColumn<T>(
  actions: LineItemActions<T>
): ColumnDef<T, unknown> | null {
  const { onView, onEdit, onDelete } = actions;
  if (!onView && !onEdit && !onDelete) return null;
  return {
    id: 'actions',
    header: 'Ações',
    cell: (info) => {
      const row = info.row.original;
      return (
        <RowActionButtons
          onView={onView && (() => onView(row))}
          onEdit={onEdit && (() => onEdit(row))}
          onDelete={onDelete && (() => onDelete(row))}
        />
      );
    },
    meta: { align: 'center', className: 'w-36', canHide: false }
  };
}

interface RowDetailFooterActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * The Editar / Remover buttons shown in a RowDetailPanel footer. Returns null
 * when neither handler is provided so callers can pass it through directly.
 */
export function RowDetailFooterActions({ onEdit, onDelete }: RowDetailFooterActionsProps) {
  if (!onEdit && !onDelete) return null;
  return (
    <div className="flex justify-end gap-2">
      {onEdit && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit size={16} className="mr-1" />
          Editar
        </Button>
      )}
      {onDelete && (
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 size={16} className="mr-1" />
          Remover
        </Button>
      )}
    </div>
  );
}
