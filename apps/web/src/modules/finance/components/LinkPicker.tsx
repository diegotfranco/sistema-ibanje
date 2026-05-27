import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/Button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface Fund {
  id: number;
  name: string;
}

interface Event {
  id: number;
  title: string;
}

interface Props {
  funds: Fund[];
  events: Event[];
  fundId: number | undefined;
  eventId: number | undefined;
  onChangeFund: (id: number | undefined) => void;
  onChangeEvent: (id: number | undefined) => void;
  isLoading?: boolean;
  className?: string;
}

export function LinkPicker({
  funds,
  events,
  fundId,
  eventId,
  onChangeFund,
  onChangeEvent,
  isLoading = false,
  className
}: Props) {
  const [open, setOpen] = React.useState(false);

  const selectedLabel = fundId
    ? (funds.find((f) => f.id === fundId)?.name ?? 'Campanha')
    : eventId
      ? (events.find((e) => e.id === eventId)?.title ?? 'Evento')
      : null;

  const handleClear = () => {
    onChangeFund(undefined);
    onChangeEvent(undefined);
    setOpen(false);
  };

  const handleSelectFund = (id: number) => {
    onChangeFund(id);
    onChangeEvent(undefined);
    setOpen(false);
  };

  const handleSelectEvent = (id: number) => {
    onChangeEvent(id);
    onChangeFund(undefined);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          data-input-trigger=""
          className={cn('w-full justify-between min-w-0', className)}>
          <span className={cn('truncate', !selectedLabel && 'text-muted-foreground')}>
            {selectedLabel ?? 'Sem vínculo'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Pesquisar campanhas e eventos..." />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            {isLoading && <CommandItem disabled>Carregando...</CommandItem>}
            {!isLoading && (fundId || eventId) && (
              <>
                <CommandGroup>
                  <CommandItem value="__clear__" onSelect={handleClear}>
                    <Check className="mr-2 h-4 w-4 opacity-0" />
                    Sem vínculo
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}
            {funds.length > 0 && (
              <CommandGroup heading="Campanhas">
                {funds.map((f) => (
                  <CommandItem
                    key={`fund-${f.id}`}
                    value={`campanha ${f.name} ${f.id}`}
                    onSelect={() => handleSelectFund(f.id)}>
                    <Check
                      className={cn('mr-2 h-4 w-4', fundId === f.id ? 'opacity-100' : 'opacity-0')}
                    />
                    {f.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {events.length > 0 && (
              <CommandGroup heading="Eventos">
                {events.map((e) => (
                  <CommandItem
                    key={`event-${e.id}`}
                    value={`evento ${e.title} ${e.id}`}
                    onSelect={() => handleSelectEvent(e.id)}>
                    <Check
                      className={cn('mr-2 h-4 w-4', eventId === e.id ? 'opacity-100' : 'opacity-0')}
                    />
                    {e.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
