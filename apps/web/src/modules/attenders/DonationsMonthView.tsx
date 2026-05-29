import { formatDate } from '@/lib/datetime';
import type { AttenderDonationsEntries } from '@/modules/me/useDonations';

function formatBRL(value: string): string {
  return Number.parseFloat(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  });
}

function entryLabel(
  categoryName: string,
  fundName: string | null,
  eventName: string | null
): string {
  const suffix = fundName ?? eventName;
  return suffix ? `${categoryName} (${suffix})` : categoryName;
}

type Props = {
  data: AttenderDonationsEntries | undefined;
  isLoading: boolean;
};

export default function DonationsMonthView({ data, isLoading }: Props) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>;
  }

  if (!data || data.entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">Sem contribuições neste mês.</p>
    );
  }

  return (
    <div className="space-y-1">
      <ul className="divide-y divide-border/60">
        {data.entries.map((e) => (
          <li key={e.id} className="flex items-start justify-between gap-3 py-2 px-1">
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {entryLabel(e.categoryName, e.fundName, e.eventName)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(e.depositDate)} · {e.paymentMethodName}
              </div>
            </div>
            <span className="font-mono text-sm tabular-nums shrink-0">{formatBRL(e.amount)}</span>
          </li>
        ))}
      </ul>

      <div className="flex justify-between items-baseline px-1 pt-2 border-t border-border">
        <span className="text-sm font-bold">Total do mês</span>
        <span className="text-sm font-bold tabular-nums">{formatBRL(data.total)}</span>
      </div>
    </div>
  );
}
