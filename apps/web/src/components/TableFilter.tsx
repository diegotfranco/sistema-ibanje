import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Select';

export interface TableFilterOption {
  value: string;
  label: string;
}

interface TableFilterProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: TableFilterOption[];
  allLabel?: string;
  className?: string;
}

const ALL = '__all__';

export function TableFilter({
  value,
  onChange,
  options,
  allLabel = 'Todos',
  className = 'w-40'
}: TableFilterProps) {
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
