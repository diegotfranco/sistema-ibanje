export type Permission = { module: string; action: string };

export type MeResponse = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  permissions: Permission[];
};
