export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type PermissionEntry = [number, number[]]; // [area, [actions]]

export type User = {
  id: number;
  email: string;
  name: string;
  role: string;
  permissions: PermissionEntry[];
};
