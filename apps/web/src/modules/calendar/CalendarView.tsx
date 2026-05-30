import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import type { EventInput, EventClickArg, DatesSetArg } from '@fullcalendar/core';
import type { CalendarFeedItem, CalendarFeedType } from '@sistema-ibanje/shared';
import { useCalendarFeed } from './useCalendar';
import './calendar-theme.css';

// Token-backed colors per feed type (see feedback-chart-colors: chart palette for series).
const TYPE_COLOR: Record<CalendarFeedType, string> = {
  lembrete: 'var(--primary)',
  aniversario: 'var(--chart-2)',
  batismo: 'var(--chart-3)',
  evento: 'var(--chart-4)'
};

const TYPE_PREFIX: Record<CalendarFeedType, string> = {
  lembrete: '',
  aniversario: '🎂 ',
  batismo: '💧 ',
  evento: ''
};

function toLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface Props {
  initialView: 'dayGridMonth' | 'listMonth';
  canWrite: boolean;
  onAddDate: (dateISO: string) => void;
  onEditEntry: (item: CalendarFeedItem) => void;
  /** Pixel height, or 'auto' to grow with content. */
  height?: number | 'auto';
  /** Hide the Month/Agenda switch (used by the compact dashboard embed). */
  hideViewSwitch?: boolean;
}

export function CalendarView({
  initialView,
  canWrite,
  onAddDate,
  onEditEntry,
  height = 'auto',
  hideViewSwitch = false
}: Props) {
  const [range, setRange] = useState<{ from: string; to: string }>();
  const { data } = useCalendarFeed(range?.from, range?.to);

  const events = useMemo<EventInput[]>(() => {
    if (!data) return [];
    return data.map((item) => {
      const editable = item.type === 'lembrete';
      return {
        id:
          item.id != null
            ? `entry-${item.id}`
            : `${item.type}-${item.attenderId ?? item.eventId}-${item.date}`,
        title: `${TYPE_PREFIX[item.type]}${item.title}`,
        start: item.date,
        allDay: true,
        editable: false,
        backgroundColor: TYPE_COLOR[item.type],
        borderColor: TYPE_COLOR[item.type],
        extendedProps: { item, readonly: !editable }
      };
    });
  }, [data]);

  const handleDatesSet = (arg: DatesSetArg) => {
    // arg.end is exclusive; step back one day for an inclusive upper bound.
    const inclusiveEnd = new Date(arg.end);
    inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
    setRange({ from: toLocalISO(arg.start), to: toLocalISO(inclusiveEnd) });
  };

  const handleDateClick = (arg: DateClickArg) => {
    if (canWrite) onAddDate(arg.dateStr);
  };

  const handleEventClick = (arg: EventClickArg) => {
    const item = arg.event.extendedProps.item as CalendarFeedItem | undefined;
    if (item && item.type === 'lembrete') onEditEntry(item);
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
      initialView={initialView}
      locale={ptBrLocale}
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: hideViewSwitch ? '' : 'dayGridMonth,listMonth'
      }}
      buttonText={{ today: 'Hoje', month: 'Mês', list: 'Agenda' }}
      events={events}
      datesSet={handleDatesSet}
      dateClick={handleDateClick}
      eventClick={handleEventClick}
      eventClassNames={(arg) => (arg.event.extendedProps.readonly ? ['fc-event-readonly'] : [])}
      height={height}
      firstDay={0}
      dayMaxEvents={3}
      noEventsText="Nenhuma data no período."
    />
  );
}
