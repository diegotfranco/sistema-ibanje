import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Props = {
  status: string;
  className?: string;
};

const STATUS_CLASSES: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  ativo: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  inativo: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200',
  paga: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  cancelada: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200',
  aberto: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  'em revisão': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  aprovado: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  fechado: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
};

export default function StatusBadge({ status, className }: Props) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge variant="outline" className={cn(STATUS_CLASSES[status] ?? '', className)}>
      {label}
    </Badge>
  );
}
