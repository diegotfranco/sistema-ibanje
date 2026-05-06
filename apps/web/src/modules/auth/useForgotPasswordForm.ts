import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { zodResolver } from '@/lib/zodResolver';
import { ForgotPasswordSchema, type ForgotPasswordFormValues } from '@/modules/auth/schema';
import { api } from '@/lib/api';

export function useForgotPasswordForm() {
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: '' }
  });

  const { mutate: requestReset, isPending } = useMutation({
    mutationFn: (data: ForgotPasswordFormValues) =>
      api.post('/auth/password-reset/request', { email: data.email }),
    onSuccess: () => {
      toast.success('Se este e-mail estiver cadastrado, você receberá as instruções em breve.');
    },
    onError: () => {
      // Always show the same message to avoid email enumeration
      toast.success('Se este e-mail estiver cadastrado, você receberá as instruções em breve.');
    }
  });

  const onSubmit = (values: ForgotPasswordFormValues) => requestReset(values);

  return {
    form,
    onSubmit,
    isPending
  };
}
