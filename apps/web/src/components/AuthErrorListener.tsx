import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { setAuthErrorHandler } from '@/lib/api';
import { paths } from '@/lib/paths';

export function AuthErrorListener() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    setAuthErrorHandler(() => {
      queryClient.clear();
      // Avoid redirect loop if already on a public auth page.
      const onAuthPage =
        window.location.pathname === paths.login ||
        window.location.pathname === paths.register ||
        window.location.pathname === paths.forgotPassword ||
        window.location.pathname === paths.resetPassword;
      if (!onAuthPage) {
        navigate(paths.login, { replace: true });
      }
    });
    return () => setAuthErrorHandler(null);
  }, [navigate, queryClient]);

  return null;
}
