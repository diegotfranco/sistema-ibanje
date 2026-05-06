import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, invalidateCsrfToken } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

export function useLogout() {
  const navigate = useNavigate();

  const { mutate: logout, isPending } = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      invalidateCsrfToken();
      queryClient.removeQueries({ queryKey: ['currentUser'] });
      toast.success('Sessão encerrada.');
      navigate('/login', { replace: true });
    },
    onError: () => {
      toast.error('Não foi possível encerrar a sessão. Tente novamente.');
    }
  });

  return {
    logout,
    isPending
  };
}
