import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

export interface ResourceColumn<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

export interface CustomAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  className?: string;
}

interface ResourceListPageProps<T> {
  title: string;
  columns: ResourceColumn<T>[];
  data: T[] | undefined;
  isLoading: boolean;
  onCreate?: () => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  customActions?: CustomAction<T>[];
  emptyMessage?: string;
  rowKey: (row: T) => string | number;
}

export function ResourceListPage<T>({
  title,
  columns,
  data,
  isLoading,
  onCreate,
  onEdit,
  onDelete,
  canCreate,
  canEdit,
  canDelete,
  customActions,
  emptyMessage = 'Nenhum registro encontrado.',
  rowKey
}: ResourceListPageProps<T>) {
  const showActions =
    (canEdit && onEdit) || (canDelete && onDelete) || (customActions && customActions.length > 0);

  return (
    <div className="p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">{title}</CardTitle>
          {canCreate && onCreate && (
            <Button onClick={onCreate} size="sm">
              <Plus className="h-4 w-4" />
              Novo
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.header} className={col.className}>
                    {col.header}
                  </TableHead>
                ))}
                {showActions && <TableHead className="w-32 text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (showActions ? 1 : 0)}
                    className="text-center text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && data?.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + (showActions ? 1 : 0)}
                    className="text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                data?.map((row) => (
                  <TableRow key={rowKey(row)}>
                    {columns.map((col) => (
                      <TableCell key={col.header} className={col.className}>
                        {col.cell(row)}
                      </TableCell>
                    ))}
                    {showActions && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {customActions?.map((action) => (
                            <Button
                              key={action.label}
                              size="icon"
                              variant="ghost"
                              onClick={() => action.onClick(row)}
                              aria-label={action.label}
                              className={action.className}
                              title={action.label}>
                              {action.icon || action.label}
                            </Button>
                          ))}
                          {canEdit && onEdit && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => onEdit(row)}
                              aria-label="Editar"
                              className="text-warning hover:text-warning/80">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {canDelete && onDelete && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => onDelete(row)}
                              aria-label="Remover"
                              className="text-destructive hover:text-destructive/80">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
