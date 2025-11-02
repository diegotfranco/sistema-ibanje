import { useMutation } from '@tanstack/react-query';
import { userService } from '@/services/userService';

export const useCreateMutation = () => {
  return useMutation({
    mutationFn: userService.create
  });
};
