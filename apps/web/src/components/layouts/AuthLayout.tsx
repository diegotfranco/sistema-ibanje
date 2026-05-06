import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { ReactNode } from 'react';

type AuthLayoutProps = {
  illustration?: ReactNode;
  children: ReactNode;
};

export const AuthLayout = ({ illustration, children }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen w-full bg-linear-to-tr from-teal-100 via-slate-100 to-slate-50 lg:bg-none lg:bg-slate-50">
      <div className="hidden lg:flex lg:w-5/12 2xl:w-4/12 justify-center items-center bg-teal-900 px-12">
        {illustration}
      </div>
      <div className="flex flex-1 flex-col px-4 sm:px-8">
        <div className="flex justify-end pt-6">
          <ThemeToggle />
        </div>
        <div className="flex flex-1 justify-center items-center">
          <Card className="w-full max-w-sm">{children}</Card>
        </div>
      </div>
    </div>
  );
};
