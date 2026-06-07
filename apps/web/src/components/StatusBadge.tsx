import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getStatusClass, getStatusLabel } from '@/lib/status';

type Props = {
  status: string | null | undefined;
  className?: string;
};

export default function StatusBadge({ status, className }: Props) {
  if (!status) {
    return (
      <Badge variant="outline" className={cn('text-muted-foreground', className)}>
        —
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn(getStatusClass(status), className)}>
      {getStatusLabel(status)}
    </Badge>
  );
}
