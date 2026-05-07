import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMembersReport } from '@/modules/finance/reports/useReports';

interface Props {
  month: string;
}

export function MemberStats({ month }: Props) {
  const { data: report, isLoading } = useMembersReport(month);

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
      {/* Active Members */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Membros ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{report.totalActiveMembers}</div>
        </CardContent>
      </Card>

      {/* Tithe */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Dízimo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">
            {report.tithe.membersWhoContributed}
          </div>
          <CardDescription className="mt-1 text-xs text-slate-500">
            ({report.tithe.percentage}% do total)
          </CardDescription>
        </CardContent>
      </Card>

      {/* Offerings */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">Ofertas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">
            {report.offerings.membersWhoContributed}
          </div>
          <CardDescription className="mt-1 text-xs text-slate-500">
            ({report.offerings.percentage}% do total)
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
}
