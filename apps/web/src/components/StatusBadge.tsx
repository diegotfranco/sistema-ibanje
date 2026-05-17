import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ActiveStatus,
  type ActiveStatusValue,
  EntryStatus,
  type EntryStatusValue,
  ClosingStatus,
  type ClosingStatusValue,
  MinuteStatus,
  type MinuteStatusValue
} from '@sistema-ibanje/shared';

type Props = {
  status: string;
  className?: string;
};

const ACTIVE_STATUS_CLASSES: Record<ActiveStatusValue, string> = {
  [ActiveStatus.Active]: 'bg-success/15 text-success',
  [ActiveStatus.Inactive]: 'bg-muted text-muted-foreground',
  [ActiveStatus.Pending]: 'bg-warning/15 text-warning'
};

const ENTRY_STATUS_CLASSES: Record<EntryStatusValue, string> = {
  [EntryStatus.Pending]: 'bg-warning/15 text-warning',
  [EntryStatus.Paid]: 'bg-success/15 text-success',
  [EntryStatus.Cancelled]: 'bg-muted text-muted-foreground'
};

const CLOSING_STATUS_CLASSES: Record<ClosingStatusValue, string> = {
  [ClosingStatus.Open]: 'bg-primary-soft/15 text-primary-soft',
  [ClosingStatus.InReview]: 'bg-warning/15 text-warning',
  [ClosingStatus.Rejected]: 'bg-destructive/15 text-destructive',
  [ClosingStatus.Approved]: 'bg-success/15 text-success',
  [ClosingStatus.Closed]: 'bg-muted text-muted-foreground'
};

const MINUTE_STATUS_CLASSES: Record<MinuteStatusValue, string> = {
  [MinuteStatus.Draft]: 'bg-primary-soft/15 text-primary-soft',
  [MinuteStatus.AwaitingApproval]: 'bg-warning/15 text-warning',
  [MinuteStatus.Approved]: 'bg-success/15 text-success',
  [MinuteStatus.Replaced]: 'bg-muted text-muted-foreground'
};

function getStatusClass(status: string): string {
  if (Object.values(ActiveStatus).includes(status as ActiveStatusValue)) {
    return ACTIVE_STATUS_CLASSES[status as ActiveStatusValue] ?? '';
  }
  if (Object.values(EntryStatus).includes(status as EntryStatusValue)) {
    return ENTRY_STATUS_CLASSES[status as EntryStatusValue] ?? '';
  }
  if (Object.values(ClosingStatus).includes(status as ClosingStatusValue)) {
    return CLOSING_STATUS_CLASSES[status as ClosingStatusValue] ?? '';
  }
  if (Object.values(MinuteStatus).includes(status as MinuteStatusValue)) {
    return MINUTE_STATUS_CLASSES[status as MinuteStatusValue] ?? '';
  }
  return '';
}

export default function StatusBadge({ status, className }: Props) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge variant="outline" className={cn(getStatusClass(status), className)}>
      {label}
    </Badge>
  );
}
