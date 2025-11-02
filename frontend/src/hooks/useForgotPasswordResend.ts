import { useState, useEffect } from 'react';
import { useForgotPasswordMutation } from '@/hooks/useAuthMutations';
import type { ForgotPasswordSchema } from '@/schemas/forgotPasswordSchema';
import { toast } from 'sonner';

const BASE_COOLDOWN = 60; // first cooldown in seconds
const MAX_COOLDOWN = 5 * BASE_COOLDOWN; // optional safety cap (5 min)

export function useForgotPasswordResend() {
  const { mutateAsync: forgotPassword, isPending } = useForgotPasswordMutation();
  //add a counter to multiply the seconds at each attempt
  const [cooldown, setCooldown] = useState(BASE_COOLDOWN);
  const [attemptCount, setAttemptCount] = useState(0);

  // start countdown when resend is triggered
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = (values: ForgotPasswordSchema) => {
    if (cooldown > 0) return;

    forgotPassword(values, {
      onSuccess: () => {
        toast.success('E-mail reenviado! Verifique sua caixa de entrada.');
        const next = Math.min(BASE_COOLDOWN * (attemptCount + 1), MAX_COOLDOWN);
        setCooldown(next);
        setAttemptCount((c) => c + 1);
      },
      onError: () => {
        toast.error('Erro ao reenviar e-mail. Tente novamente.');
        const next = Math.min(BASE_COOLDOWN * (attemptCount + 1), MAX_COOLDOWN);
        setCooldown(next);
        setAttemptCount((c) => c + 1);
      }
    });
  };

  return {
    handleResend,
    isPending,
    cooldown,
    canResend: cooldown === 0 && !isPending,
    secondsLeft: cooldown
  };
}
