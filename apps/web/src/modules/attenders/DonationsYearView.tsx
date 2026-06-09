import type { AttenderDonationsSummary } from './useDonations';

function formatBRL(value: string): string {
  return Number.parseFloat(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  });
}

function groupLabel(
  categoryName: string,
  campaignName: string | null,
  eventName: string | null
): string {
  const suffix = campaignName ?? eventName;
  return suffix ? `${categoryName} (${suffix})` : categoryName;
}

type Props = {
  data: AttenderDonationsSummary | undefined;
  isLoading: boolean;
};

export default function DonationsYearView({ data, isLoading }: Props) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>;
  }

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Nenhuma contribuição encontrada.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {data.months.map((m) => (
        <section key={m.month}>
          <div className="flex justify-between items-baseline px-1 pb-1 border-b border-border">
            <h3 className="text-sm font-semibold">{m.label}</h3>
            <span className="text-sm font-semibold tabular-nums">{formatBRL(m.total)}</span>
          </div>
          {m.groups.length === 0 ? (
            <p className="text-sm text-muted-foreground/70 italic px-3 py-1.5">Sem contribuições</p>
          ) : (
            <dl className="divide-y divide-border/50">
              {m.groups.map((g, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 px-3">
                  <dt className="text-sm text-muted-foreground">
                    {groupLabel(g.categoryName, g.campaignName, g.eventName)}
                  </dt>
                  <dd className="text-sm tabular-nums">{formatBRL(g.total)}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      ))}

      <div className="flex justify-between items-baseline px-1 pt-2 border-t border-border">
        <span className="text-sm font-bold">Total do ano</span>
        <span className="text-sm font-bold tabular-nums">{formatBRL(data.grandTotal)}</span>
      </div>
    </div>
  );
}
