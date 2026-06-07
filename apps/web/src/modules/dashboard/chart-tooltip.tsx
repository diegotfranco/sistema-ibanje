import type { ReactNode } from 'react';

interface MoneyTooltipRowProps {
  color: string;
  label: ReactNode;
  value: string;
}

export function MoneyTooltipRow({ color, label, value }: MoneyTooltipRowProps) {
  return (
    <>
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
        style={{ background: color, borderColor: color }}
      />
      <div className="flex flex-1 items-center justify-between gap-2 leading-none">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-medium text-foreground tabular-nums">{value}</span>
      </div>
    </>
  );
}
