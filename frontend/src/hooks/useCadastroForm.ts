import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cadastroSchema, type CadastroSchema } from '@/schemas/cadastroSchema';
import { useState } from 'react';

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

  const [showPassword, setShowPassword] = useState(false);
  const toggleShowPassword = () => setShowPassword((p) => !p);

  const onSubmit = async (values: CadastroSchema) => {
    console.log('✅ Dados de cadastro validados:', values);

    // try {
    //   // Replace with your real API
    //   const res = await fetch('/api/register', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(values)
    //   });

    //   if (!res.ok) throw new Error('Falha no cadastro');

    //   const data = await res.json();
    //   console.log('🎉 Cadastro realizado:', data);
    //   // Redirect or show success toast
    // } catch (err) {
    //   console.error('❌ Erro no cadastro:', err);
    // }
  };

  return { form, showPassword, toggleShowPassword, onSubmit };
};
