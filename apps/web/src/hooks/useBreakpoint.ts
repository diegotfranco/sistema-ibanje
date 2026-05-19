import { useEffect, useState } from 'react';

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl';

// Tailwind v4 defaults
export const BREAKPOINT_PX: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280
};

/**
 * Returns whether the current viewport width is >= the given breakpoint.
 * SSR-safe: returns `true` (desktop assumption) until the client mounts.
 */
export function useIsAbove(bp: Breakpoint): boolean {
  const [isAbove, setIsAbove] = useState(
    typeof window === 'undefined'
      ? true
      : window.matchMedia(`(min-width: ${BREAKPOINT_PX[bp]}px)`).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINT_PX[bp]}px)`);
    const handleChange = (e: MediaQueryListEvent) => setIsAbove(e.matches);

    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, [bp]);

  return isAbove;
}
