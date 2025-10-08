import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginSchema } from '@/schemas/loginSchema';

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

  const onSubmit = (values: LoginSchema) => {
    console.log('✅ Dados validados:', values);

    // try {
    //   // Example of API request — replace with your real endpoint
    //   const res = await fetch('/api/login', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(values)
    //   });

    //   if (!res.ok) throw new Error('Falha no login');

    //   const data = await res.json();
    //   console.log('🎉 Login bem-sucedido:', data);
    //   // (Optionally) save token, redirect, etc.
    // } catch (err) {
    //   console.error('❌ Erro no login:', err);
    //   // You can add setError or toast notification later
    // }
  };

  return { form, showPassword, toggleShowPassword, onSubmit };
};
