import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cadastroSchema, type CadastroSchema } from '@/schemas/cadastroSchema';
import { useAuthNavigation } from '@/hooks/useAuthNavigation';
import { useRegisterMutation } from '@/hooks/useAuthMutations';
import { toast } from 'sonner';

export const useCadastroForm = () => {
  const form = useForm<CadastroSchema>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  const { redirectToLogin } = useAuthNavigation();
  const { mutate: register, isPending } = useRegisterMutation();

  const onSubmit = (values: CadastroSchema) => {
    register(values, {
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
