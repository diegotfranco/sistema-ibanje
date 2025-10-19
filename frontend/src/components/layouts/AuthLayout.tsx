import type { ReactNode } from 'react';

type AuthLayoutProps = {
  illustration?: ReactNode;
  children: ReactNode;
};

export const AuthLayout = ({ illustration, children }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen w-full bg-gradient-to-tr from-teal-100 via-slate-100 to-slate-50 lg:bg-none lg:bg-slate-50">
      <div className="hidden lg:flex lg:w-5/12 2xl:w-4/12 justify-center items-center bg-teal-900 px-12">
        {illustration}
      </div>

      <div className="flex flex-1 justify-center items-center px-4 sm:px-8">{children}</div>
    </div>
  );
};
