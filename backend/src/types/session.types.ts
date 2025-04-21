export type Permission = [number, number[]];

export type User = {
  id: number;
  email: string;
  name: string;
  permissions: Permission[];
  role: string;
};
