type AuthLayoutProps = {
  illustration?: React.ReactNode;
  leftBgClass?: string;
  leftPadding?: string;
  children: React.ReactNode;
};

export const AuthLayout = ({
  illustration,
  leftBgClass = 'bg-teal-900',
  leftPadding = 'p-24',
  children
}: AuthLayoutProps) => {
  return (
    <div className="flex w-full min-h-screen">
      <div className={`w-4/12 ${leftBgClass} flex justify-center items-center ${leftPadding}`}>
        {illustration}
      </div>

      <div className="grow flex justify-center items-center bg-slate-50">{children}</div>
    </div>
  );
};
