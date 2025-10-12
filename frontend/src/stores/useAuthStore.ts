import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/auth.types';
import { queryClient } from '@/lib/queryClient';
import { hasPermission } from '@/utils';

type AuthState = {
  user: User | null;
  rememberMe: boolean;
  isLoading: boolean;

  setLoading: (loading: boolean) => void;

  can: (area: number, acao: number) => boolean;
  isAuthenticated: () => boolean;
  hasRole: (roleName: string) => boolean;

  setUser: (user: User | null, rememberMe?: boolean) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      rememberMe: false,
      isLoading: true,

      setLoading: (loading) => set({ isLoading: loading }),

      can: (area, acao) => {
        const user = get().user;
        return hasPermission(user, area, acao);
      },

      isAuthenticated: () => !!get().user,
      hasRole: (roleName) => get().user?.role === roleName,

      setUser: (user, rememberMe = false) => {
        // if user logs in with rememberMe=true, persist to localStorage
        set({ user, rememberMe });

        // Prevent stale state in the "other" storage
        if (rememberMe) {
          sessionStorage.removeItem('auth-storage');
        } else {
          localStorage.removeItem('auth-storage');
        }
      },

      clearUser: () => {
        set({ user: null, rememberMe: false });
        sessionStorage.removeItem('auth-storage');
        localStorage.removeItem('auth-storage');
        queryClient.clear(); // ✅ ensures sensitive cached data is removed
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        const raw = sessionStorage.getItem('auth-storage') || localStorage.getItem('auth-storage');
        const saved = raw ? JSON.parse(raw) : null;
        return saved?.state?.rememberMe ? localStorage : sessionStorage;
      })
    }
  )
);
