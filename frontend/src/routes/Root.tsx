import { Outlet } from 'react-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { useInitializeSession } from '@/hooks/useInitializeSession';
import { Spinner } from '@/components/ui/spinner';

export const Root = () => {
  const { isLoading } = useAuthStore();
  useInitializeSession();

  if (isLoading) {
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-background">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex h-dvh font-roboto">
      <Outlet />
    </div>
  );
};
