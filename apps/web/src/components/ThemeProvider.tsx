import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeProviderContext, type Theme, type ThemeProviderProps } from '@/hooks/useTheme';

const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';
const THEME_VALUES: Theme[] = ['dark', 'light'];

function isTheme(value: string | null): value is Theme {
  if (value === null) {
    return false;
  }

  return THEME_VALUES.includes(value as Theme);
}

function disableTransitionsTemporarily() {
  const style = document.createElement('style');
  style.appendChild(
    document.createTextNode(
      '*,*::before,*::after{-webkit-transition:none!important;transition:none!important}'
    )
  );
  document.head.appendChild(style);

  return () => {
    window.getComputedStyle(document.body);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        style.remove();
      });
    });
  };
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'theme',
  disableTransitionOnChange = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem(storageKey);
    if (isTheme(storedTheme)) {
      return storedTheme;
    }

    return defaultTheme;
  });

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      localStorage.setItem(storageKey, nextTheme);
      setThemeState(nextTheme);
    },
    [storageKey]
  );

  const applyTheme = useCallback(
    (nextTheme: Theme) => {
      const root = document.documentElement;
      const restoreTransitions = disableTransitionOnChange ? disableTransitionsTemporarily() : null;

      const swap = () => {
        root.classList.remove('light', 'dark');
        root.classList.add(nextTheme);
      };

      const alreadyApplied = root.classList.contains(nextTheme);
      const docWithVT = document as Document & {
        startViewTransition?: (cb: () => void) => {
          finished?: Promise<void>;
          ready?: Promise<void>;
          updateCallbackDone?: Promise<void>;
        };
      };

      if (!alreadyApplied && typeof docWithVT.startViewTransition === 'function') {
        const transition = docWithVT.startViewTransition(swap);
        // Swallow AbortError rejections when a transition is skipped
        // (e.g., StrictMode double-effect or rapid toggles).
        transition.finished?.catch(() => {});
        transition.ready?.catch(() => {});
        transition.updateCallbackDone?.catch(() => {});
      } else {
        swap();
      }

      if (restoreTransitions) {
        restoreTransitions();
      }
    },
    [disableTransitionOnChange]
  );

  useEffect(() => {
    applyTheme(theme);

    if (theme !== 'light') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY);
    const handleChange = () => {
      applyTheme('light');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, applyTheme]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.storageArea !== localStorage) {
        return;
      }

      if (event.key !== storageKey) {
        return;
      }

      if (isTheme(event.newValue)) {
        setThemeState(event.newValue);
        return;
      }

      setThemeState(defaultTheme);
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [defaultTheme, storageKey]);

  const value = useMemo(
    () => ({
      theme,
      setTheme
    }),
    [theme, setTheme]
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
