import axios from '@/lib/axios';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/useAuthStore';
import type { RegisterRequest, LoginRequest, User } from '@/types/auth.types';

export const authService = {
  async register(data: RegisterRequest) {
    const res = await axios.post('/v1/usuarios/register', data);
    return res.data;
  },

  async login(data: LoginRequest): Promise<User> {
    const res = await axios.post<User>('/v1/usuarios/login', data);
    const user = res.data;

    useAuthStore.getState().setUser(user);
    await queryClient.invalidateQueries({ queryKey: ['session'] });

    return user;
  },

  async logout(): Promise<void> {
    await axios.post('/v1/usuarios/logout');
    useAuthStore.getState().clearUser();
    await queryClient.invalidateQueries({ queryKey: ['session'] });
  },

  async refreshSession(): Promise<User | null> {
    try {
      const res = await axios.get<User>('/v1/usuarios/session');
      const user = res.data;
      useAuthStore.getState().setUser(user);
      return user;
    } catch {
      useAuthStore.getState().clearUser();
      return null;
    }
  }
};
