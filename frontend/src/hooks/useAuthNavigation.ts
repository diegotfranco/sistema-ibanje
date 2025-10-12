import { useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';

export const useAuthNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Persist the "from" path across StrictMode remounts
  const fromRef = useRef<string>((location.state as { from?: Location })?.from?.pathname ?? '/');

  const redirectAfterLogin = () => {
    navigate(fromRef.current, { replace: true });
  };

  const redirectToLogin = () => {
    navigate('/login', { replace: true });
  };

  const redirectToHome = () => {
    navigate('/', { replace: true });
  };

  return { redirectAfterLogin, redirectToLogin, redirectToHome };
};
