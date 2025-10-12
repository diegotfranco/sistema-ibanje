import type { ReactNode } from 'react';

type ListaProps = {
  children?: ReactNode;
};

export const Lista = ({ children }: ListaProps) => (
  <nav className="flex flex-col gap-2 p-4 overflow-y-auto">{children}</nav>
);
