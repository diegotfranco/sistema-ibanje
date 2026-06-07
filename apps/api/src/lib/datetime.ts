import { APP_TZ } from '@sistema-ibanje/shared';

// en-CA formats as YYYY-MM-DD, so this yields the calendar day a UTC instant falls on in the
// app's business timezone — the authoritative conversion for bucketing timestamptz onto a day.
const APP_LOCAL_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

export function utcToAppLocalDate(instant: Date): string {
  return APP_LOCAL_DATE.format(instant);
}
