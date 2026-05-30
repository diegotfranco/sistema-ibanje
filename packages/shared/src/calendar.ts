// Merged calendar feed served by GET /calendar/feed. Sources:
// - 'lembrete'    → editable manual calendar_entries (id is the entry id)
// - 'aniversario' → derived attender birthdays (read-only; attenderId set)
// - 'batismo'     → derived attender baptism anniversaries (read-only; attenderId set)
// - 'evento'      → finance events on their app-local start date (read-only; eventId set)
export type CalendarFeedType = 'lembrete' | 'aniversario' | 'batismo' | 'evento';

export type CalendarFeedItem = {
  id: number | null;
  eventId?: number;
  attenderId?: number;
  title: string;
  date: string; // YYYY-MM-DD (app-local calendar day)
  type: CalendarFeedType;
  notes?: string | null;
};

export type CalendarFeedResponse = CalendarFeedItem[];
