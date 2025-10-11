import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cadastroSchema, type CadastroSchema } from '@/schemas/cadastroSchema';
import { useNavigate } from 'react-router';
import { useRegisterMutation } from '@/hooks/useAuthMutations';
import { toast } from 'sonner';

export const useCadastroForm = () => {
  // 1️⃣ Setup react-hook-form + Zod validation
  const form = useForm<CadastroSchema>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  // 2️⃣ Local UI state (not related to API)
  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword((p) => !p);

  // 3️⃣ React Query mutation for registration
  const { mutate: register, isPending } = useRegisterMutation();

  const navigate = useNavigate();

  // 4️⃣ Form submission handler
  const onSubmit = (values: CadastroSchema) => {
    register(values, {
      onSuccess: () => {
        toast.success('Cadastro realizado com sucesso!');
        navigate('/login');
      },
      onError: (error) => {
        toast.error(error.message || 'Erro ao realizar cadastro');
      }
    });
  };

  // 5️⃣ Return everything your UI needs
  return {
    form,
    showPassword,
    toggleShowPassword,
    onSubmit,
    isPending
  };
};
