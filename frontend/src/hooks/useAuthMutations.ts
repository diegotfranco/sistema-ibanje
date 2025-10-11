import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';

export const useLoginMutation = () => {
  return useMutation({
    mutationFn: authService.login
  });
};

export const useLogoutMutation = () => {
  return useMutation({
    mutationFn: authService.logout
  });
};

export const useRegisterMutation = () => {
  return useMutation({
    mutationFn: authService.register // we’ll add this next
  });
};
