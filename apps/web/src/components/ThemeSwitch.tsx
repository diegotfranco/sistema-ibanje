import { Switch as SwitchPrimitive } from 'radix-ui';
import { SunMedium, Moon } from 'lucide-react';
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
      className="group/theme-switch relative inline-flex h-4.5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-sidebar-border bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
      <SwitchPrimitive.Thumb className="pointer-events-none relative flex h-3.5 w-4 translate-x-px items-center justify-center rounded-full bg-zinc-50 shadow-sm transition-all duration-300 ease-out data-[state=checked]:translate-x-4.25 data-[state=checked]:bg-zinc-950">
        <SunMedium
          size={8}
          className={cn(
            'absolute text-zinc-950 transition-opacity duration-300 ease-out',
            isDark ? 'opacity-0' : 'opacity-100'
          )}
        />
        <Moon
          size={8}
          className={cn(
            'absolute text-zinc-50 transition-opacity duration-300 ease-out',
            isDark ? 'opacity-100' : 'opacity-0'
          )}
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}
