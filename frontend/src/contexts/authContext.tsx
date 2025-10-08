import { createContext, useMemo, useState, type JSX } from 'react';
import type { Auth, AuthContextType, AuthProviderProps } from '@/types/auth.types';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  // const [auth, setAuth] = useState<Auth | null>(null);
  const [auth, setAuth] = useState<Auth | null>({
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWVnb0BkZXYuY29tIiwibmFtZSI6IkRpZWd1aW5obyBHYW1lcGxheXMiLCJwZXJtaXNzaW9ucyI6WyJob21lIiwiZW50cmFkYXMiLCJzYWlkYXMiXSwiaWF0IjoxNzU5ODY1MDgzfQ.DtSM9TeGN72eCDjTQ1FVu-M3oNJrNv3qebxnHqlOgBo'
  });

  const value = useMemo(() => ({ auth, setAuth }), [auth, setAuth]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
