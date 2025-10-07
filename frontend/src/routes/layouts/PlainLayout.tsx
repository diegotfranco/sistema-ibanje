import type { ReactNode } from 'react';
import { PermissionGate } from 'routes/PermissionGate';

type PlainLayoutProps = {
  children: ReactNode;
  permission?: string;
};

export const PlainLayout = ({ children, permission }: PlainLayoutProps) => (
  <PermissionGate permission={permission}>{children}</PermissionGate>
);
