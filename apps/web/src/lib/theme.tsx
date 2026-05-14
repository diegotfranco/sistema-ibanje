import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type Resolved = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolved: Resolved;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    return (stored as Theme) || 'system';
  });

  const [resolved, setResolved] = useState<Resolved>(() => {
    const stored = localStorage.getItem('theme');
    const t = stored || 'system';
    if (t === 'dark') return 'dark';
    if (t === 'light') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const updateResolved = () => {
      if (theme === 'dark') {
        setResolved('dark');
      } else if (theme === 'light') {
        setResolved('light');
      } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setResolved(isDark ? 'dark' : 'light');
      }
    };

    updateResolved();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => updateResolved();
      mediaQuery.addEventListener('change', handleChange);
      unsubscribe = () => mediaQuery.removeEventListener('change', handleChange);
    }

    return unsubscribe;
  }, [theme]);

  useEffect(() => {
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [resolved]);

  const contextValue = useMemo(() => ({ theme, setTheme, resolved }), [theme, resolved]);

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
