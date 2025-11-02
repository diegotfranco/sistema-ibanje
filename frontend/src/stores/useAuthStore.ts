import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/auth.types';
import { queryClient } from '@/lib/queryClient';
import { hasPermission } from '@/utils';

type AuthState = {
  user: User | null;
  rememberMe: boolean;

  can: (module: number, action: number) => boolean;
  isAuthenticated: () => boolean;
  hasRole: (role: number) => boolean;

  setUser: (user: User | null, rememberMe?: boolean) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      rememberMe: false,

      can: (module, action) => {
        const user = get().user;
        return hasPermission(user, module, action);
      },

      isAuthenticated: () => !!get().user,
      hasRole: (role) => get().user?.role === role,

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
        // Instead of clearing the entire cache (which causes a refetch loop),
        // we remove all queries EXCEPT the initial session query.
        queryClient.removeQueries({
          predicate: (query) => query.queryKey[0] !== 'session'
        });
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
