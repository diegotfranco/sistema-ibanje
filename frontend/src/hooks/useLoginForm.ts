import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginSchema } from '@/schemas/loginSchema';
import { useAuthNavigation } from '@/hooks/useAuthNavigation';
import { useLoginMutation } from '@/hooks/useAuthMutations';
import { toast } from 'sonner';

export const useLoginForm = () => {
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true }
  });

  const { redirectAfterLogin } = useAuthNavigation();
  const { mutate: login, isPending } = useLoginMutation();

  const onSubmit = (values: LoginSchema) => {
    login(values, {
      onSuccess: () => {
        toast.success('Login realizado com sucesso!');
        redirectAfterLogin();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message ?? 'Falha no login.';
        toast.error(message);
      }
    });
  };

  return { form, onSubmit, isPending };
};
