import * as React from 'react';
import { Input } from '@/components/ui/input';

// Month-granular fields use the `YYYY-MM` wire value, displayed as `MM/AAAA`. Mirrors
// DateInput's masked-text approach; no calendar popover (a month is a coarse pick).
type Props = Omit<React.ComponentPropsWithoutRef<typeof Input>, 'type'>;

function isoMonthToBr(iso: string): string {
  if (!iso || typeof iso !== 'string') return '';
  const trimmed = iso.trim();
  if (trimmed.length !== 7 || trimmed[4] !== '-') return '';
  return `${trimmed.slice(5, 7)}/${trimmed.slice(0, 4)}`;
}

function brToIsoMonth(br: string): string | null {
  if (!br || typeof br !== 'string') return null;
  const trimmed = br.trim();
  if (trimmed.length !== 7 || trimmed[2] !== '/') return null;
  const month = Number.parseInt(trimmed.slice(0, 2), 10);
  const year = Number.parseInt(trimmed.slice(3, 7), 10);
  if (Number.isNaN(month) || Number.isNaN(year)) return null;
  if (month < 1 || month > 12) return null;
  if (year < 1900 || year > 2999) return null;
  return `${trimmed.slice(3, 7)}-${trimmed.slice(0, 2)}`;
}

function applyMask(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 6)}`;
}

export default React.forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onBlur, name, className, disabled, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>(() =>
      isoMonthToBr(value as string)
    );

    React.useEffect(() => {
      setDisplayValue(isoMonthToBr(value as string));
    }, [value]);

    const emit = (iso: string) => {
      const syntheticEvent = {
        target: { value: iso, name }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(syntheticEvent);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = applyMask(e.currentTarget.value);
      setDisplayValue(masked);
      emit(brToIsoMonth(masked) ?? '');
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (!brToIsoMonth(displayValue)) setDisplayValue('');
      onBlur?.(e);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder="mm/aaaa"
        maxLength={7}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        name={name}
        disabled={disabled}
        className={className}
        {...props}
      />
    );
  }
);
