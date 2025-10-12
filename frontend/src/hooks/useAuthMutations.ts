import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/useAuthStore';
import { queryClient } from '@/lib/queryClient';
import type { LoginRequest } from '@/types/auth.types';

export const useLoginMutation = () => {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const user = await authService.login(data);
      return { user, rememberMe: data.rememberMe };
    },
    onSuccess: async ({ user, rememberMe }) => {
      setUser(user, rememberMe);
      await queryClient.invalidateQueries({ queryKey: ['session'] });
    }
  });
};

export const useLogoutMutation = () => {
  const { clearUser } = useAuthStore();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: async () => {
      clearUser();
    }
  });
};

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: authService.register // we’ll add this next
  });
};
