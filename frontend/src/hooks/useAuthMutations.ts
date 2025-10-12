import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/useAuthStore';
import { queryClient } from '@/lib/queryClient';

export const useLoginMutation = () => {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: authService.login,
    onSuccess: async (user) => {
      setUser(user);
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
      await queryClient.invalidateQueries({ queryKey: ['session'] });
    }
  });
};

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: authService.register // we’ll add this next
  });
};
