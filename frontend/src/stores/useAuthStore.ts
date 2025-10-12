import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/auth.types';

type AuthState = {
  user: User | null;
  can: (area: number, acao: number) => boolean;
  hasRole: (roleName: string) => boolean;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  isAuthenticated: () => boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,

      can: (area, acao) => {
        const user = get().user;
        if (!user) return false;
        return user.permissions.some(([a, acoes]) => a === area && acoes.includes(acao));
      },

      hasRole: (roleName) => get().user?.role === roleName,

      setLoading: (loading) => set({ isLoading: loading }),
      isAuthenticated: () => !!get().user,

      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null })
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage)
    }
  )
);
