import type { Dispatch, ReactNode, SetStateAction } from 'react';

type AuthPayload = {
  sub: string;
  name: string;
  permissions: string[];
  iat: number;
};

type Auth = {
  token: string;
};

type AuthContextType = {
  auth: Auth | null;
  setAuth: Dispatch<SetStateAction<Auth | null>>;
};

type AuthProviderProps = {
  children: ReactNode;
};

export type { AuthPayload, Auth, AuthContextType, AuthProviderProps };
