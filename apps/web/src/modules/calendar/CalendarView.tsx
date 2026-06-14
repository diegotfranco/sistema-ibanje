import { useMemo, useRef, useState, type ReactNode } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import type { EventInput, EventClickArg, DatesSetArg } from '@fullcalendar/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarFeedItem, CalendarFeedType } from '@sistema-ibanje/shared';
import { Button } from '@/components/Button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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

// pt-BR labels for the legend that names each color/symbol used on the grid.
const TYPE_LABEL: Record<CalendarFeedType, string> = {
  lembrete: 'Lembrete',
  aniversario: 'Aniversário',
  batismo: 'Batismo',
  evento: 'Evento'
};

const LEGEND_ORDER: CalendarFeedType[] = ['lembrete', 'aniversario', 'batismo', 'evento'];

// Recolor the shadcn tab's active state from the default raised-card look to the brand primary
// (twMerge drops the base data-active bg/text/border in favor of these). Light + dark both.
const PRIMARY_TAB =
  'data-active:bg-primary data-active:text-primary-foreground dark:data-active:border-transparent dark:data-active:bg-primary dark:data-active:text-primary-foreground';

type CalendarViewType = 'dayGridMonth' | 'listMonth';

function toLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Wraps a trigger in the app's shadcn tooltip (provider mounted in AppLayout). Used by the custom
// toolbar below so the nav/view buttons get the styled bubble instead of FullCalendar's native
// browser `title` tooltips.
function WithTooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

interface Props {
  initialView: CalendarViewType;
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
  const calendarRef = useRef<FullCalendar>(null);
  const [range, setRange] = useState<{ from: string; to: string }>();
  const [view, setView] = useState<CalendarViewType>(initialView);
  const [title, setTitle] = useState('');
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

  // We render our own toolbar (headerToolbar={false}), so navigation goes through the imperative
  // FullCalendar API. datesSet keeps the title + active view in sync with prev/next/today/changeView.
  const api = () => calendarRef.current?.getApi();

  const handleDatesSet = (arg: DatesSetArg) => {
    // arg.end is exclusive; step back one day for an inclusive upper bound.
    const inclusiveEnd = new Date(arg.end);
    inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
    setRange({ from: toLocalISO(arg.start), to: toLocalISO(inclusiveEnd) });
    setTitle(arg.view.title);
    setView(arg.view.type as CalendarViewType);
  };

  const handleDateClick = (arg: DateClickArg) => {
    if (canWrite) onAddDate(arg.dateStr);
  };

  const handleEventClick = (arg: EventClickArg) => {
    const item = arg.event.extendedProps.item as CalendarFeedItem | undefined;
    if (item && item.type === 'lembrete') onEditEntry(item);
  };

  // Mirror FullCalendar's native behavior: the "Hoje" button is disabled while today is already in
  // the visible range (string compare is safe on YYYY-MM-DD), which also restores its greyed state.
  const todayISO = toLocalISO(new Date());
  const todayInView = !!range && range.from <= todayISO && todayISO <= range.to;

  return (
    <div>
      <div className="mb-3 grid grid-cols-[auto_1fr_auto] items-center gap-2">
        <div className="flex items-center gap-1">
          <WithTooltip label="Mês anterior">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Mês anterior"
              onClick={() => api()?.prev()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </WithTooltip>
          <WithTooltip label="Próximo mês">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Próximo mês"
              onClick={() => api()?.next()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </WithTooltip>
          <Button variant="outline" size="sm" disabled={todayInView} onClick={() => api()?.today()}>
            Hoje
          </Button>
        </div>
        <h2 className="truncate text-center text-base font-semibold capitalize sm:text-lg">
          {title}
        </h2>
        <div className="flex items-center justify-end gap-1">
          {!hideViewSwitch && (
            <Tabs value={view} onValueChange={(v) => api()?.changeView(v)}>
              <TabsList>
                <TabsTrigger value="dayGridMonth" className={PRIMARY_TAB}>
                  Mês
                </TabsTrigger>
                <TabsTrigger value="listMonth" className={PRIMARY_TAB}>
                  Agenda
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, listPlugin, interactionPlugin]}
        initialView={initialView}
        locale={ptBrLocale}
        headerToolbar={false}
        events={events}
        datesSet={handleDatesSet}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventClassNames={(arg) => (arg.event.extendedProps.readonly ? ['fc-event-readonly'] : [])}
        height={height}
        firstDay={0}
        dayMaxEvents={3}
        noEventsText="Nenhuma data no período."
        // Suppress FullCalendar's native browser `title` on the "+N mais" link and replace it with
        // the app's shadcn tooltip, rendered through FC's React content injection.
        moreLinkHint=""
        moreLinkContent={(arg) => (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{arg.text}</span>
            </TooltipTrigger>
            <TooltipContent>
              {`Mostrar mais ${arg.num} ${arg.num === 1 ? 'evento' : 'eventos'}`}
            </TooltipContent>
          </Tooltip>
        )}
      />
      <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {LEGEND_ORDER.map((type) => (
          <li key={type} className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: TYPE_COLOR[type] }}
            />
            <span>
              {TYPE_PREFIX[type]}
              {TYPE_LABEL[type]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
