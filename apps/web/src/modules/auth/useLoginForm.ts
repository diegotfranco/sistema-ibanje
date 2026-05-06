import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { zodResolver } from '@/lib/zodResolver';
import { LoginSchema, type LoginFormValues } from '@/modules/auth/schema';
import { api, ApiError } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';
import { useCurrentUser } from '@/modules/auth/useCurrentUser';

export function useLoginForm() {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '', rememberMe: true }
  });

  const { mutate: login, isPending } = useMutation({
    mutationFn: (data: LoginFormValues) =>
      api.post('/auth/login', { email: data.email, password: data.password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Seja bem-vindo!');
      navigate('/dashboard', { replace: true });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 401) {
        toast.error('E-mail ou senha inválidos');
        // form.setError('root', { message: 'E-mail ou senha inválidos.' });
      } else {
        toast.error('Ocorreu um erro. Tente novamente');
        // form.setError('root', { message: 'Ocorreu um erro. Tente novamente.' });
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
