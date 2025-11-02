import { Link, Navigate, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import HandFinanceGraph from '@/components/icons/HandFinanceGraph';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { useForgotPasswordResend } from '@/hooks/useForgotPasswordResend';
import routes from '@/enums/routes.enum';

type ForgotPasswordLocationState = {
  email: string;
};

const ForgotPasswordSent = () => {
  const location = useLocation();
  const state = location.state as ForgotPasswordLocationState | null;
  const email = state?.email ?? '';

  const { handleResend, canResend, secondsLeft, isPending } = useForgotPasswordResend();

  // if user navigated here directly (no email in state), redirect back
  if (!email) return <Navigate to={routes.FORGOT_PASSWORD.path} replace />;

  return (
    <AuthLayout illustration={<HandFinanceGraph className="text-slate-50 max-w-xs" />}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-6 text-center">
        <header className="mb-8">
          <h1 className="text-2xl font-light underline underline-offset-8 decoration-teal-600 decoration-1">
            Sistema Ibanje
          </h1>
        </header>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-teal-600">Verifique seu e-mail</h2>
          <Link
            to={routes.LOGIN.path}
            className="text-sm font-light text-slate-600 hover:underline underline-offset-4 decoration-teal-600">
            Voltar para o login
          </Link>
        </div>
        <p className="text-sm font-noto-sans text-justify font-light mb-6">
          {`Um link para redefinir sua senha foi enviado para `}
          <span className="italic font-normal text-teal-700">{email}</span>
          {`. Caso não o tenha recebido, verifique a pasta de spam ou tente reenviar abaixo.`}
        </p>

        <Button
          onClick={() => handleResend({ email })}
          disabled={!canResend}
          className="w-full bg-teal-700 hover:bg-teal-800">
          {isPending ? 'Reenviando...' : canResend ? 'Reenviar e-mail' : `Aguarde ${secondsLeft}s`}
        </Button>
      </div>
    </AuthLayout>
  );
};

export default ForgotPasswordSent;
