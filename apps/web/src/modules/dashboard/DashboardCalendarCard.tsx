import { Card, CardContent, CardHeader, CardTitle } from '@/components/Card';
import { cn } from '@/lib/utils';
import { CalendarSurface } from '@/modules/calendar/CalendarSurface';

interface Props {
  className?: string;
}

// Compact agenda embed of the shared calendar. Read/write is gated inside CalendarSurface by the
// SecretaryCalendar permissions, so congregants see a read-only agenda of the merged feed.
export function DashboardCalendarCard({ className }: Props) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardTitle>Calendário</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        <CalendarSurface initialView="listMonth" height={360} hideViewSwitch />
      </CardContent>
    </Card>
  );
}
