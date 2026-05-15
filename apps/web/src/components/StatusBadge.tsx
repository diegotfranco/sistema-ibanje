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
  [ActiveStatus.Active]:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  [ActiveStatus.Inactive]: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200',
  [ActiveStatus.Pending]: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
};

const ENTRY_STATUS_CLASSES: Record<EntryStatusValue, string> = {
  [EntryStatus.Pending]: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  [EntryStatus.Paid]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  [EntryStatus.Cancelled]: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
};

const CLOSING_STATUS_CLASSES: Record<ClosingStatusValue, string> = {
  [ClosingStatus.Open]: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  [ClosingStatus.InReview]: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  [ClosingStatus.Rejected]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  [ClosingStatus.Approved]:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  [ClosingStatus.Closed]: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200'
};

const MINUTE_STATUS_CLASSES: Record<MinuteStatusValue, string> = {
  [MinuteStatus.Draft]: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  [MinuteStatus.AwaitingApproval]:
    'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  [MinuteStatus.Approved]:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  [MinuteStatus.Replaced]: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
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
