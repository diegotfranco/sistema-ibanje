import { useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { zodResolver } from '@/lib/zodResolver';
import { ResetPasswordSchema, type ResetPasswordFormValues } from '@/modules/auth/schema';
import { api, ApiError } from '@/lib/api';

export function useResetPasswordForm(token: string) {
  const navigate = useNavigate();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' }
  });

  const { mutate: resetPassword, isPending } = useMutation({
    mutationFn: (data: ResetPasswordFormValues) =>
      api.post('/auth/password-reset/confirm', { token, newPassword: data.newPassword }),
    onSuccess: () => {
      toast.success('Senha definida com sucesso! Faça login para continuar.');
      navigate('/login', { replace: true });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 400) {
        toast.error('Link inválido ou expirado. Solicite um novo.');
      } else {
        toast.error('Ocorreu um erro. Tente novamente.');
      }
    }
  });

  const onSubmit = (values: ResetPasswordFormValues) => resetPassword(values);

  return {
    form,
    onSubmit,
    isPending
  };
}
