import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, invalidateCsrfToken } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import routes from '@/enums/routes.enum';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();

  const { mutate: logout, isPending } = useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSuccess: () => {
      invalidateCsrfToken();
      queryClient.removeQueries({ queryKey: ['currentUser'] });
      toast.success('Sessão encerrada.');
      navigate(routes.LOGIN.path, { replace: true });
    },
    onError: () => {
      toast.error('Não foi possível encerrar a sessão. Tente novamente.');
    }
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Painel</h1>
        <Button variant="outline" size="sm" onClick={() => logout()} disabled={isPending}>
          {isPending ? 'Saindo...' : 'Sair'}
        </Button>
      </div>
      {user && <p className="mt-2 text-slate-500">Bem-vindo, {user.name}.</p>}
    </div>
  );
}
