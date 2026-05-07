import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export type StatusPageProps = {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  actions: ReactNode;
};

export function StatusPage({ icon: Icon, title, description, actions }: StatusPageProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-6">
            <Icon className="w-12 h-12 text-muted-foreground" />
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">{title}</h1>
              <div className="text-muted-foreground max-w-md">{description}</div>
            </div>
            <div className="flex gap-3 justify-center w-full">{actions}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
