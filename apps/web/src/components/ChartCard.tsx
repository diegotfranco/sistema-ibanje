import type { ReactNode } from 'react';
import { Card, CardAction, CardContent, CardHeader } from '@/components/Card';

interface ChartCardProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function ChartCard({
  title,
  action,
  children,
  className,
  contentClassName
}: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader compact>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {action && <CardAction>{action}</CardAction>}
      </CardHeader>
      <CardContent className={contentClassName}>{children}</CardContent>
    </Card>
  );
}
