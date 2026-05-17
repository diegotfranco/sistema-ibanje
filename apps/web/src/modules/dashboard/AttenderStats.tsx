import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAttendersReport } from '@/modules/finance/reports/useReports';

interface Props {
  month: string;
}

export function AttenderStats({ month }: Props) {
  const { data: report, isLoading } = useAttendersReport(month);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Congregados ativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-card-foreground">
            {report.totalActiveAttenders}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Dízimo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-card-foreground">
            {report.tithe.attendersWhoContributed}
          </div>
          <CardDescription className="mt-1 text-xs text-muted-foreground">
            ({report.tithe.percentage}% do total)
          </CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Ofertas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-card-foreground">
            {report.offerings.attendersWhoContributed}
          </div>
          <CardDescription className="mt-1 text-xs text-muted-foreground">
            ({report.offerings.percentage}% do total)
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
