import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/useAuthStore';
import { Spinner } from './ui/spinner';

/**
 * This component is responsible for checking the user's session when the app first loads.
 * It ensures the session check is performed only once and handles the application's
 * initial loading state.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);

  const {
    data: user,
    isSuccess,
    isError,
    isLoading
  } = useQuery({
    queryKey: ['session'],
    queryFn: authService.getSession,
    retry: false, // Don't retry on failure, as a 401 is an expected outcome
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    if (!isLoading) {
      if (isSuccess && user) {
        setUser(user);
      } else if (isError) {
        clearUser();
      }
    }
  }, [isLoading, isSuccess, isError, user, setUser, clearUser]);

  // This component now provides the root layout for the entire application.
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-background font-roboto">
      {isLoading ? <Spinner /> : children}
    </div>
  );
}
