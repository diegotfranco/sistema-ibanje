import axios from '@/lib/axios';
import type { RegisterRequest, LoginRequest, User } from '@/types/auth.types';

export const authService = {
  async register(data: RegisterRequest) {
    const res = await axios.post('/v1/auth/register', data);
    return res.data;
  },

  async login(data: LoginRequest): Promise<User> {
    const res = await axios.post<User>('/v1/auth/login', data);
    const user = res.data;
    return user;
  },

  async logout(): Promise<void> {
    await axios.post('/v1/auth/logout');
  },

  async refreshSession(): Promise<User | null> {
    const res = await axios.get<User>('/v1/auth/session');
    const user = res.data;
    return user;
  }
};
