import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMembersReport, useFundsReport } from './useReports';
import { FundDetailDialog } from './FundDetailDialog';

interface Props {
  from: string;
  to: string;
}

const formatMoney = (s: string) =>
  `R$ ${parseFloat(s).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function MembersFundsTab({ from, to }: Props) {
  const membersReport = useMembersReport(from, to);
  const fundsReport = useFundsReport(from, to);
  const [selectedFundId, setSelectedFundId] = useState<number | null>(null);

  return (
    <div className="mt-4 space-y-4">
      {/* Members report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Relatório de Membros</CardTitle>
        </CardHeader>
        <CardContent>
          {membersReport.isLoading && (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          )}
          {membersReport.data && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Membros Ativos</p>
                <p className="text-2xl font-semibold">{membersReport.data.totalActiveMembers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contribuíram com Dízimo</p>
                <p className="text-2xl font-semibold">
                  {membersReport.data.tithe.membersWhoContributed}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    ({membersReport.data.tithe.percentage}%)
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contribuíram com Oferta</p>
                <p className="text-2xl font-semibold">
                  {membersReport.data.offerings.membersWhoContributed}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    ({membersReport.data.offerings.percentage}%)
                  </span>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Funds report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fundos Designados</CardTitle>
        </CardHeader>
        <CardContent>
          {fundsReport.isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {fundsReport.data && fundsReport.data.funds.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum fundo no período.</p>
          )}
          {fundsReport.data && fundsReport.data.funds.length > 0 && (
            <div className="space-y-2">
              {fundsReport.data.funds.map((fund) => (
                <div
                  key={fund.fundId}
                  className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{fund.fundName}</p>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      <span>
                        Arrecadado:{' '}
                        <span className="text-emerald-600 font-mono">
                          {formatMoney(fund.totalRaised)}
                        </span>
                      </span>
                      <span>
                        Saídas:{' '}
                        <span className="text-red-600 font-mono">
                          {formatMoney(fund.totalExpenses)}
                        </span>
                      </span>
                      <span>
                        Saldo: <span className="font-mono">{formatMoney(fund.balance)}</span>
                      </span>
                      {fund.progressPercentage && <span>{fund.progressPercentage}% da meta</span>}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedFundId(fund.fundId)}>
                    Detalhar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedFundId !== null && (
        <FundDetailDialog
          open={selectedFundId !== null}
          onOpenChange={(v) => !v && setSelectedFundId(null)}
          fundId={selectedFundId}
          from={from}
          to={to}
        />
      )}
    </div>
  );
}
