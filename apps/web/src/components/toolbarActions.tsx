import type { ReactNode } from 'react';
import { ArrowLeft, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

// A page-level secondary toolbar action (trash toggle, export, etc.). Declared once per page and
// rendered two ways: as outline buttons in the DataTable toolbar on desktop (`ToolbarActionButtons`),
// and as items inside a header overflow menu on mobile (`ToolbarActionsMenu`), since that toolbar is
// hidden below `md`.
export interface ToolbarAction {
  key: string;
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

// Desktop: a row of transparent-outline buttons matching the "Colunas" button. Pass to a DataTable
// `toolbarRight`. Returns null when there are no actions so callers can hand it straight through.
export function ToolbarActionButtons({ actions }: { actions: ToolbarAction[] }) {
  if (actions.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      {actions.map((action) => (
        <Button
          key={action.key}
          type="button"
          variant="outline"
          className="bg-transparent"
          size="sm"
          onClick={action.onClick}
          disabled={action.disabled}>
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
}

// Mobile: a kebab overflow menu holding the same actions as menu items. Rendered in the always-visible
// card header (caller adds `md:hidden`), so the actions stay reachable when the desktop toolbar is gone.
export function ToolbarActionsMenu({
  actions,
  className
}: {
  actions: ToolbarAction[];
  className?: string;
}) {
  if (actions.length === 0) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={className ? `bg-transparent ${className}` : 'bg-transparent'}
          size="icon-sm"
          aria-label="Mais ações">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {actions.map((action) => (
          <DropdownMenuItem key={action.key} onSelect={action.onClick} disabled={action.disabled}>
            {action.icon}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Trash "Lixeira" / "Voltar" toggle as a descriptor (replaces the former <TrashToggle> component).
export function trashToggleAction(
  viewingTrash: boolean,
  onToggle: (viewingTrash: boolean) => void
): ToolbarAction {
  return {
    key: 'trash',
    label: viewingTrash ? 'Voltar' : 'Lixeira',
    icon: viewingTrash ? <ArrowLeft className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />,
    onClick: () => onToggle(!viewingTrash)
  };
}
