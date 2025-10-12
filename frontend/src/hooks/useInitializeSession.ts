import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEffect } from 'react';

export const useInitializeSession = () => {
  const { rememberMe, setUser, clearUser, setLoading } = useAuthStore();

  const query = useQuery({
    queryKey: ['session'],
    queryFn: authService.refreshSession,
    enabled: rememberMe, // 🔑 only run if rememberMe = true
    retry: false
  });

  useEffect(() => {
    if (!rememberMe) {
      // User didn’t choose to persist session
      setLoading(false);
      return;
    }

    if (query.isSuccess) {
      setUser(query.data, rememberMe);
      setLoading(false);
    } else if (query.isError) {
      clearUser();
      setLoading(false);
    }
  }, [rememberMe, query.isSuccess, query.isError, query.data, setUser, clearUser, setLoading]);

  return query;
};
