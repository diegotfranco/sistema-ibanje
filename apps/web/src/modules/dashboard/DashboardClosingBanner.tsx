import { useNavigate } from 'react-router';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { ClosingStatus } from '@sistema-ibanje/shared';
import { useMonthlyClosings } from '@/modules/finance/monthly-closings/useMonthlyClosings';
import { Skeleton } from '@/components/ui/skeleton';
import { getCurrentMonth, formatMonthForBanner, isPastClosing } from './dashboard-utils';
import type { MonthlyClosingResponse } from '@/schemas/monthly-closing';

function buildHintText(count: number): string {
  if (count <= 1) return '';
  const itemsCount = count - 1;
  const itemPlural = itemsCount > 1 ? 's' : '';
  const statusPlural = count > 2 ? 's' : '';
  return ` +${itemsCount} outro${itemPlural} pendente${statusPlural}`;
}

export function DashboardClosingBanner() {
  const navigate = useNavigate();
  const { data: response, isLoading } = useMonthlyClosings();
  const closings = response?.data || [];
  const currentMonth = getCurrentMonth();
  const [currentYear, currentMonthStr] = currentMonth.split('-');
  const currentMonthNum = Number.parseInt(currentMonthStr, 10);
  const currentYearNum = Number.parseInt(currentYear, 10);

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (!response) {
    return null;
  }

  // Find closings that are past the current month and not closed
  const pendingPast = closings
    .filter((c: MonthlyClosingResponse) => {
      const isPast = isPastClosing(c.periodYear, c.periodMonth, currentMonth);
      const notClosed = c.status !== ClosingStatus.Closed;
      return isPast && notClosed;
    })
    .sort((a: MonthlyClosingResponse, b: MonthlyClosingResponse) => {
      const aKey = a.periodYear * 100 + a.periodMonth;
      const bKey = b.periodYear * 100 + b.periodMonth;
      return aKey - bKey;
    });

  // Find current month closing
  const currentMonthClosing = closings.find(
    (c: MonthlyClosingResponse) =>
      c.periodYear === currentYearNum && c.periodMonth === currentMonthNum
  );

  // Case 1: Past months with pending closings
  if (pendingPast.length > 0) {
    const oldest = pendingPast[0];
    const monthStr = `${oldest.periodYear}-${String(oldest.periodMonth).padStart(2, '0')}`;
    const hintText = buildHintText(pendingPast.length);

    return (
      <Alert variant="destructive" className="mb-6 bg-destructive/10">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="font-semibold">
              Fechamento de {formatMonthForBanner(monthStr)} está em {oldest.status}
            </span>
            {hintText && <span className="text-xs opacity-75">{hintText}</span>}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/monthly-closings/${oldest.id}`)}>
            Abrir
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Case 2: Current month closing exists
  if (currentMonthClosing) {
    const monthStr = `${currentMonthClosing.periodYear}-${String(currentMonthClosing.periodMonth).padStart(2, '0')}`;
    return (
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            Fechamento de {formatMonthForBanner(monthStr)}:{' '}
            <span className="font-medium">{currentMonthClosing.status}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/monthly-closings/${currentMonthClosing.id}`)}>
            Abrir
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Case 3: No closing for current month - CTA
  return (
    <Alert className="mb-6 border-primary/50 bg-primary/5">
      <AlertCircle className="h-4 w-4 text-primary" />
      <AlertDescription className="flex items-center justify-between">
        <span>Crie o fechamento para {formatMonthForBanner(currentMonth)}</span>
        <Button size="sm" onClick={() => navigate('/monthly-closings')}>
          Criar fechamento
        </Button>
      </AlertDescription>
    </Alert>
  );
}
