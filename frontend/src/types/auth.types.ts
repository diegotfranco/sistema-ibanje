export type Permission = [number, number[]]; // [module], [actions]]

export type User = {
  email: string;
  name: string;
  role_name: string;
  role: number;
  permissions: Permission[];
};

export type LoginRequest = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type SignUpRequest = {
  name: string;
  email: string;
  password: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  password: string;
  token: string;
};
