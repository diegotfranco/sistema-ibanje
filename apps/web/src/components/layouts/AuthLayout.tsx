import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { ReactNode } from 'react';

type AuthLayoutProps = {
  children: ReactNode;
};

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-8 overflow-hidden">
      {/* Elegant Theme-Aware Background Glows */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 dark:bg-primary/5 blur-[100px]" />
        <div className="absolute top-[60%] right-[-10%] w-[40%] h-[60%] rounded-full bg-primary/10 dark:bg-primary/5 blur-[100px]" />
      </div>

      <div className="absolute top-6 right-6 lg:top-8 lg:right-8 z-20">
        <ThemeToggle />
      </div>

      <div className="z-10 w-full max-w-md">
        <Card className="w-full border-border shadow-xl bg-card">{children}</Card>
      </div>
    </div>
  );
};
