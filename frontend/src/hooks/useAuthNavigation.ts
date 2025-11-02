import { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import routes from '@/enums/routes.enum';

export const useAuthNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Persist the "from" path across StrictMode remounts
  const fromRef = useRef<string>((location.state as { from?: Location })?.from?.pathname ?? routes.ROOT.path);

  const redirectAfterLogin = () => {
    navigate(fromRef.current, { replace: true });
  };

  const redirectToLogin = () => {
    navigate(routes.LOGIN.path, { replace: true });
  };

  const redirectToHome = () => {
    navigate(routes.ROOT.path, { replace: true });
  };

  const redirectForgotPasswordEmailSent = (email: string) => {
    navigate(routes.FORGOT_PASSWORD_EMAIL_SENT.path, { state: { email } });
  };

  return { redirectAfterLogin, redirectToLogin, redirectToHome, redirectForgotPasswordEmailSent };
};
