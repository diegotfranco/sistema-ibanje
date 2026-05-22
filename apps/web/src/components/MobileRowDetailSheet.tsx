import type { ReactNode } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';

export interface RowDetailField {
  label: string;
  value: ReactNode;
  hideEmpty?: boolean;
}

interface MobileRowDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: RowDetailField[];
  actions?: ReactNode;
}

function isEmptyValue(value: ReactNode): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' || trimmed === '—';
  }
  return false;
}

export function MobileRowDetailSheet({
  open,
  onOpenChange,
  title,
  description,
  fields,
  actions
}: MobileRowDetailSheetProps) {
  const visibleFields = fields.filter((f) => !(f.hideEmpty && isEmptyValue(f.value)));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <dl className="divide-y px-4">
          {visibleFields.map((field) => (
            <div key={field.label} className="flex items-start justify-between gap-4 py-3">
              <dt className="text-sm text-muted-foreground shrink-0">{field.label}</dt>
              <dd className="text-sm text-right min-w-0">{field.value}</dd>
            </div>
          ))}
        </dl>
        {actions && <SheetFooter>{actions}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}
