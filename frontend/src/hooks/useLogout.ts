import { useLogoutMutation } from '@/hooks/useAuthMutations';
import { useAuthNavigation } from '@/hooks/useAuthNavigation';
import { toast } from 'sonner';

export const useLogout = () => {
  const { redirectToLogin } = useAuthNavigation();
  const { mutate: logoutMutation, isPending } = useLogoutMutation();

  const logout = () => {
    logoutMutation(undefined, {
      onSuccess: () => {
        toast.success('Sessão encerrada com sucesso.');
        redirectToLogin();
      },
      onError: () => {
        toast.error('Erro ao encerrar sessão.');
      }
    });
  };

  return { logout, isPending };
};
