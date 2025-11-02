import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/useAuthStore';
import type { LoginRequest } from '@/types/auth.types';

export const useLoginMutation = () => {
  const { setUser, clearUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      // Perform login and get user data in one call
      const user = await authService.login(data);

      return { user, rememberMe: data.rememberMe };
    },

    onSuccess: ({ user, rememberMe }) => {
      if (user) {
        // 1. Set the user in our global Zustand store
        setUser(user, rememberMe);
        // 2. Set the user in the React Query cache for the 'session' query
        queryClient.setQueryData(['session'], user);
      } else {
        clearUser();
        queryClient.setQueryData(['session'], null);
      }
    },

    onError: () => {
      clearUser();
      queryClient.setQueryData(['session'], null);
    }
  });
};

export const useForgotPasswordMutation = () => {
  return useMutation({
    mutationFn: authService.forgotPassword
  });
};

export const useResetPasswordMutation = () => {
  return useMutation({
    mutationFn: authService.resetPassword
  });
};

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: authService.signup
  });
};

export const useLogoutMutation = () => {
  const { clearUser } = useAuthStore();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      clearUser();
    }
  });
};
