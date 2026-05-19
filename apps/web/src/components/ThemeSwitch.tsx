import { Switch as SwitchPrimitive } from 'radix-ui';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <SwitchPrimitive.Root
      checked={isDark}
      onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
      aria-label="Alternar tema"
      className="group/theme-switch relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border border-transparent bg-input transition-colors duration-300 ease-in-out data-[state=checked]:bg-foreground/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <SwitchPrimitive.Thumb className="pointer-events-none relative flex h-4 w-4 translate-x-0.5 items-center justify-center rounded-full bg-background text-foreground shadow-sm transition-transform duration-300 ease-in-out data-[state=checked]:translate-x-5">
        <Sun
          size={10}
          className={cn(
            'absolute transition-opacity duration-300 ease-in-out',
            isDark ? 'opacity-0' : 'opacity-100'
          )}
        />
        <Moon
          size={10}
          className={cn(
            'absolute transition-opacity duration-300 ease-in-out',
            isDark ? 'opacity-100' : 'opacity-0'
          )}
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}
