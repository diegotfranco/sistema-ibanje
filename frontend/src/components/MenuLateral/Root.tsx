import type { ReactNode } from 'react';

type RootProps = {
  children?: ReactNode;
};

export const Root = ({ children }: RootProps) => (
  <aside className="h-full min-h-screen flex flex-col border-r bg-white w-72 shadow-sm">
    <div className="grow flex flex-col">{children}</div>
  </aside>
);
