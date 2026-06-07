import { PageContainer } from '@/components/PageContainer';
import { Card, CardContent } from '@/components/Card';
import { CalendarSurface } from './CalendarSurface';

// Below md the month grid is too cramped, so open on the agenda (list) view; wider screens get
// the month grid. Computed once at mount.
const initialView =
  typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
    ? 'dayGridMonth'
    : 'listMonth';

export default function CalendarPage() {
  return (
    <PageContainer>
      <Card>
        <CardContent className="p-3 sm:p-4">
          <CalendarSurface initialView={initialView} height="auto" />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
