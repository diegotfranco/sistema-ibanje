import { useState } from 'react';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import type { CalendarFeedItem } from '@sistema-ibanje/shared';
import { CalendarView } from './CalendarView';
import { CalendarEntryDrawer, type CalendarDraft } from './CalendarEntryDrawer';
import { useCalendarMutations } from './useCalendar';
import type { CalendarEntryFormValues } from './schema';

interface Props {
  initialView: 'dayGridMonth' | 'listMonth';
  height?: number | 'auto';
  hideViewSwitch?: boolean;
}

// Self-contained calendar: renders the grid/agenda and wires the add/edit drawer to the CRUD
// mutations. Reused by the Secretaria management page and the dashboard embed.
export function CalendarSurface({ initialView, height, hideViewSwitch }: Props) {
  const { data: user } = useCurrentUser();
  const perms = user?.permissions;
  const canCreate = hasPermission(perms, Module.SecretaryCalendar, Action.Create);
  const canEdit = hasPermission(perms, Module.SecretaryCalendar, Action.Update);

  const { create, update, remove } = useCalendarMutations();
  const [draft, setDraft] = useState<CalendarDraft | null>(null);
  const isPending = create.isPending || update.isPending || remove.isPending;

  const openNew = (date: string) => {
    if (canCreate) setDraft({ id: null, date });
  };
  const openEdit = (item: CalendarFeedItem) => {
    if (canEdit && item.id != null) {
      setDraft({ id: item.id, title: item.title, date: item.date, notes: item.notes ?? null });
    }
  };
  const close = () => setDraft(null);

  const handleSubmit = (values: CalendarEntryFormValues) => {
    if (draft?.id == null) {
      create.mutate(values, { onSuccess: close });
    } else {
      update.mutate({ id: draft.id, body: values }, { onSuccess: close });
    }
  };

  const handleDelete = (id: number) => remove.mutate(id, { onSuccess: close });

  return (
    <>
      <CalendarView
        initialView={initialView}
        canWrite={canCreate}
        onAddDate={openNew}
        onEditEntry={openEdit}
        height={height}
        hideViewSwitch={hideViewSwitch}
      />
      <CalendarEntryDrawer
        draft={draft}
        isPending={isPending}
        onClose={close}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </>
  );
}
