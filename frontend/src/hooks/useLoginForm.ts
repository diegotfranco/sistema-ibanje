import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginSchema } from '@/schemas/loginSchema';
import { useNavigate } from 'react-router';
import { useLoginMutation } from '@/hooks/useAuthMutations';
import { toast } from 'sonner';

export const useLoginForm = () => {
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true
    }
  });

  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword((p) => !p);

  const navigate = useNavigate();
  const { mutate: login, isPending } = useLoginMutation();

  const onSubmit = (values: LoginSchema) => {
    login(values, {
      onSuccess: () => {
        toast.success('Login realizado com sucesso!');
        navigate('/');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Falha no login');
      }
    });
  };

  return {
    form,
    showPassword,
    toggleShowPassword,
    onSubmit,
    isPending
  };
};
