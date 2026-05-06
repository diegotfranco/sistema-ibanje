import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type EntityPickerProps<T> = {
  items: T[];
  value: number | null;
  onChange: (next: number | null) => void;
  getValue: (item: T) => number;
  getLabel: (item: T) => string;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  isLoading?: boolean;
  allowClear?: boolean;
  className?: string;
};

const EntityPicker = React.forwardRef<HTMLButtonElement, EntityPickerProps<any>>(
  (
    {
      items,
      value,
      onChange,
      getValue,
      getLabel,
      placeholder = 'Selecionar...',
      emptyMessage = 'Nenhum resultado.',
      disabled = false,
      isLoading = false,
      allowClear = false,
      className
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const selectedLabel = items.find((item) => getValue(item) === value)
      ? getLabel(items.find((item) => getValue(item) === value)!)
      : placeholder;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn('justify-between', className)}>
            {selectedLabel}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder={placeholder} />
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {isLoading && <CommandItem disabled>Carregando...</CommandItem>}
                {!isLoading && allowClear && (
                  <CommandItem
                    value="clear"
                    onSelect={() => {
                      onChange(null);
                      setOpen(false);
                    }}>
                    <Check
                      className={cn('mr-2 h-4 w-4', value === null ? 'opacity-100' : 'opacity-0')}
                    />
                    Limpar seleção
                  </CommandItem>
                )}
                {items.map((item) => {
                  const itemValue = getValue(item);
                  return (
                    <CommandItem
                      key={itemValue}
                      value={`${getLabel(item)} ${itemValue}`}
                      onSelect={() => {
                        onChange(itemValue);
                        setOpen(false);
                      }}>
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === itemValue ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {getLabel(item)}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

EntityPicker.displayName = 'EntityPicker';

export default EntityPicker;
