import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordSchema } from '@/schemas/forgotPasswordSchema';
import { useAuthNavigation } from '@/hooks/useAuthNavigation';
import { useForgotPasswordMutation } from '@/hooks/useAuthMutations';
import { toast } from 'sonner';

export function useForgotPasswordForm() {
  const { redirectForgotPasswordEmailSent } = useAuthNavigation();
  const { mutate: forgotPassword, isPending } = useForgotPasswordMutation();

  const form = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = (values: ForgotPasswordSchema) => {
    forgotPassword(values, {
      onSuccess: () => {
        redirectForgotPasswordEmailSent(values.email);
      },
      onError: () => {
        // add a specific error for email not in database
        toast.error('Não foi possível enviar o link. Tente novamente.');
      }
    });
  };

  return { form, onSubmit, isPending };
}
