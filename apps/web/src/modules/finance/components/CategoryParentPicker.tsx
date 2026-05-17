import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export interface CategoryNode {
  id: number;
  name: string;
  parentId: number | null;
}

interface CategoryParentPickerProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  options: CategoryNode[];
  /** When editing an existing category, exclude it from the parent options. */
  excludeId?: number;
  placeholder?: string;
  disabled?: boolean;
}

const NONE_VALUE = '__none__';

export function CategoryParentPicker({
  value,
  onChange,
  options,
  excludeId,
  placeholder = 'Sem pai (raiz)',
  disabled
}: CategoryParentPickerProps) {
  // Two-level hierarchy: only root categories (parentId === null) can be parents.
  const rootOptions = options.filter((o) => o.parentId === null && o.id !== excludeId);

  return (
    <Select
      value={value === undefined ? NONE_VALUE : String(value)}
      onValueChange={(v) => onChange(v === NONE_VALUE ? undefined : Number(v))}
      disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>Sem pai (raiz)</SelectItem>
        {rootOptions.map((opt) => (
          <SelectItem key={opt.id} value={String(opt.id)}>
            {opt.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
