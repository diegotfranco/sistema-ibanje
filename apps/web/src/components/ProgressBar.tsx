interface Props {
  value: string;
  target: string;
  dimmed?: boolean;
}

export function ProgressBar({ value, target, dimmed = false }: Props) {
  const v = Number.parseFloat(value);
  const t = Number.parseFloat(target);
  const pct = t > 0 ? Math.min((v / t) * 100, 100) : 0;
  return (
    <div className="relative h-2 overflow-hidden rounded-full bg-muted">
      <div
        className={`h-full transition-all ${
          dimmed ? 'bg-muted-foreground opacity-50' : 'bg-primary'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
