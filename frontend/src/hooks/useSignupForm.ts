import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, type SignupSchema } from '@/schemas/signupSchema';
import { useAuthNavigation } from '@/hooks/useAuthNavigation';
import { useRegisterMutation } from '@/hooks/useAuthMutations';
import { toast } from 'sonner';

export const useSignupForm = () => {
  const form = useForm<SignupSchema>({
    resolver: zodResolver(signupSchema),
    mode: 'onSubmit', // ensures async schema runs properly
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const { redirectToLogin } = useAuthNavigation();
  const { mutate: signup, isPending } = useRegisterMutation();

  const onSubmit = (values: SignupSchema) => {
    signup(values, {
      onSuccess: () => {
        toast.success('Cadastro realizado com sucesso!');
        redirectToLogin();
      },
      onError: (error: any) => {
        const message = error?.response?.data?.message ?? 'Erro ao realizar cadastro.';
        toast.error(message);
      }
    });
  };

  return { form, onSubmit, isPending };
};
