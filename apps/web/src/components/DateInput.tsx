import * as React from 'react';
import { Input } from '@/components/ui/input';

type Props = Omit<React.ComponentPropsWithoutRef<typeof Input>, 'type'>;

/**
 * Convert ISO date string (yyyy-MM-dd) to Brazilian format (dd/MM/yyyy).
 * Returns empty string if input is empty/falsy or invalid.
 */
function isoToBr(iso: string): string {
  if (!iso || typeof iso !== 'string') return '';
  const trimmed = iso.trim();
  if (trimmed.length !== 10 || trimmed[4] !== '-' || trimmed[7] !== '-') {
    return '';
  }
  const year = trimmed.slice(0, 4);
  const month = trimmed.slice(5, 7);
  const day = trimmed.slice(8, 10);
  return `${day}/${month}/${year}`;
}

/**
 * Convert Brazilian format (dd/MM/yyyy) to ISO date string (yyyy-MM-dd).
 * Returns null if input is invalid, incomplete, or out of range.
 * Validates: day 1-31, month 1-12, year 1900-2999.
 */
function brToIso(br: string): string | null {
  if (!br || typeof br !== 'string') return null;
  const trimmed = br.trim();
  if (trimmed.length !== 10 || trimmed[2] !== '/' || trimmed[5] !== '/') {
    return null;
  }
  const dayStr = trimmed.slice(0, 2);
  const monthStr = trimmed.slice(3, 5);
  const yearStr = trimmed.slice(6, 10);

  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31) return null;
  if (month < 1 || month > 12) return null;
  if (year < 1900 || year > 2999) return null;

  return `${yearStr}-${monthStr}-${dayStr}`;
}

/**
 * Apply mask to raw input: strips non-digits, then inserts '/' after positions 2 and 5.
 * Returns formatted string up to 10 characters (dd/MM/yyyy).
 */
function applyMask(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
}

export default React.forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onBlur, name, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>(() => {
      return isoToBr(value as string);
    });

    // Sync external changes (e.g., form reset) to display value
    React.useEffect(() => {
      setDisplayValue(isoToBr(value as string));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.currentTarget.value;
      const masked = applyMask(raw);
      setDisplayValue(masked);

      // Try to parse and emit ISO value if valid
      const iso = brToIso(masked);
      if (iso) {
        // Emit synthetic event with ISO value
        const syntheticEvent = {
          target: { value: iso, name }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
      } else {
        // Emit empty string for invalid/incomplete input
        const syntheticEvent = {
          target: { value: '', name }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Validate on blur; if invalid, clear display
      const iso = brToIso(displayValue);
      if (!iso) {
        setDisplayValue('');
      }
      onBlur?.(e);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        name={name}
        {...props}
      />
    );
  }
);
