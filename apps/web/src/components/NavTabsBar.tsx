import type { ReactNode } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

const triggerClassName = [
  'h-[calc(100%-5px)] px-1',
  'text-sidebar-accent-foreground after:bg-foreground/85'
].join(' ');

interface NavTab {
  value: string;
  label: string;
}

interface NavTabsBarProps {
  tabs: NavTab[];
  value: string;
  onValueChange: (value: string) => void;
  /** Optional control rendered on the right of the bar (e.g. a period filter), justified between. */
  action?: ReactNode;
}

export function NavTabsBar({ tabs, value, onValueChange, action }: NavTabsBarProps) {
  return (
    <>
      <div className="sm:hidden space-y-2 border-b px-4 py-3">
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab) => (
              <SelectItem key={tab.value} value={tab.value}>
                {tab.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {action}
      </div>
      <div className="hidden sm:flex items-center justify-between gap-4 border-b px-4 py-2">
        <TabsList variant="line">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className={triggerClassName}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {action}
      </div>
    </>
  );
}
