import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { zodResolver } from '@/lib/zodResolver';
import { RegisterSchema, type RegisterFormValues } from '@/modules/auth/schema';
import { api, ApiError } from '@/lib/api';

export function useRegisterForm() {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: { name: '', email: '' }
  });

  const { mutate: register, isPending } = useMutation({
    mutationFn: (data: RegisterFormValues) =>
      api.post('/auth/register', { name: data.name, email: data.email }),
    onSuccess: () => {
      toast.success('Cadastro enviado! Aguarde a aprovação de um administrador.');
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        toast.error('Este e-mail já está cadastrado.');
      } else {
        toast.error('Ocorreu um erro. Tente novamente.');
      }
    }
  });

  const onSubmit = (values: RegisterFormValues) => register(values);

  return {
    form,
    onSubmit,
    isPending
  };
}
