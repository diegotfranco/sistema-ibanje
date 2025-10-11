import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useEffect } from 'react';

export const useInitializeSession = () => {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  // React Query handles fetch, caching, retries, etc.
  const query = useQuery({
    queryKey: ['session'],
    queryFn: authService.refreshSession,
    retry: false
  });

  // ✅ handle side effects through useEffect instead of onSuccess/onError
  useEffect(() => {
    if (query.isSuccess) {
      setUser(query.data);
      setLoading(false);
    } else if (query.isError) {
      setUser(null);
      setLoading(false);
    }
  }, [query.isSuccess, query.isError, query.data, setUser, setLoading]);

  return query;
};
