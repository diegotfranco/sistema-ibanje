import { useAuthStore } from '@/stores/useAuthStore';
import { router } from '@/routes/Router';
import { toast } from 'sonner';

let isHandling = false;

export function handleSessionExpired() {
  if (isHandling) return;
  isHandling = true;

  const { clearUser } = useAuthStore.getState();
  clearUser();

  toast.error('A sessão expirou. Por favor, faça login novamente.');

  const currentPath = window.location.pathname;
  if (currentPath !== '/login') {
    setTimeout(() => {
      router.navigate('/login');
      isHandling = false;
    }, 100);
  } else {
    isHandling = false;
  }
}
