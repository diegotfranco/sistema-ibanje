import { useLogoutMutation } from '@/hooks/useAuthMutations';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

export const useLogout = () => {
  const navigate = useNavigate();
  const { mutate: logoutMutation, isPending } = useLogoutMutation();

  const logout = () => {
    logoutMutation(undefined, {
      onSuccess: () => {
        toast.success('Você saiu da conta.');
        navigate('/login');
      },
      onError: () => {
        toast.error('Erro ao sair.');
      }
    });
  };

  return { logout, isPending };
};
