import { createContext, useContext, type ReactNode } from 'react';

export type Theme = 'dark' | 'light';

export type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  disableTransitionOnChange?: boolean;
};

export const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}
