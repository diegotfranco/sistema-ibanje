import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthNavigation } from '@/hooks/useAuthNavigation';
import { useResetPasswordMutation } from '@/hooks/useAuthMutations';
import { resetPasswordSchema, type ResetPasswordSchema } from '@/schemas/resetPasswordSchema';
import { useSearchParams } from 'react-router';

import { toast } from 'sonner';

export function useResetPasswordForm() {
  const { redirectToLogin } = useAuthNavigation();
  const { mutate: resetPassword, isPending } = useResetPasswordMutation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // e.g. /reset-password?token=abc123

  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  const onSubmit = (values: ResetPasswordSchema) => {
    if (!token) {
      toast.error('Token inválido ou ausente.');
      return;
    }

    resetPassword(
      { ...values, token }, // you could also keep token separate if you prefer
      {
        onSuccess: () => {
          toast.success('Senha redefinida com sucesso!');
          redirectToLogin();
        },
        onError: () => {
          toast.error('Não foi possível redefinir a senha. Tente novamente.');
        }
      }
    );
  };

  return { form, onSubmit, isPending };
}
