import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { zodResolver } from '@/lib/zodResolver';
import { Module, Action, hasPermission } from '@/lib/permissions';
import { LoginSchema, type LoginFormValues } from '@/modules/auth/schema';
import { api, ApiError, rateLimitMessage } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';
import type { MeResponse } from '@sistema-ibanje/shared';

const STAFF_MODULES = [
  Module.Dashboard,
  Module.Attenders,
  Module.Users,
  Module.IncomeEntries,
  Module.ExpenseEntries,
  Module.Minutes
];

function hasStaffPermission(permissions: Record<string, number>): boolean {
  return STAFF_MODULES.some((module) => hasPermission(permissions, module, Action.View));
}

export function useLoginForm() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '', rememberMe: true }
  });

  const { mutate: login, isPending } = useMutation({
    mutationFn: (data: LoginFormValues) =>
      api.post('/auth/login', {
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe
      }),
    onSuccess: async () => {
      toast.success('Seja bem-vindo!');
      const currentUser = await queryClient.fetchQuery({
        queryKey: ['currentUser'],
        queryFn: () => api.get<MeResponse>('/auth/me')
      });

      const destination = hasStaffPermission(currentUser.permissions) ? '/dashboard' : '/me';
      navigate(destination, { replace: true });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 401) {
        toast.error('E-mail ou senha inválidos');
      } else if (err instanceof ApiError && err.status === 429) {
        toast.error(rateLimitMessage(err));
      } else {
        toast.error('Ocorreu um erro. Tente novamente');
      }
    }
  });

  const onSubmit = (values: LoginFormValues) => login(values);

  return {
    form,
    onSubmit,
    isPending,
    redirect: !!user
  };
}
