import { useSyncExternalStore } from 'react';

export function useIsMobile() {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(`(max-width: ${768 - 1}px)`);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    () => window.innerWidth < 768, // Client-side value
    () => false // Server-side fallback (optional)
  );
}
