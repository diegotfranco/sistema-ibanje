import * as React from 'react';
import { Input } from '@/components/ui/input';
import { maskCnpj, maskPhone, maskCep, toDigits } from '@/lib/format';

// Document/contact inputs that mirror DateInput/MonthInput: they hold a masked *display* value
// in local state but emit the **raw digits** as the wire value via a synthetic onChange event,
// so the form (and the API) only ever see normalized digits. Drop-in for a `Controller`.
type Props = Omit<React.ComponentPropsWithoutRef<typeof Input>, 'type'>;

function createMaskedInput(
  displayName: string,
  mask: (raw: string) => string,
  maxLength: number,
  placeholder: string
) {
  const Masked = React.forwardRef<HTMLInputElement, Props>(
    ({ value, onChange, onBlur, name, className, disabled, ...props }, ref) => {
      const [display, setDisplay] = React.useState<string>(() => mask(String(value ?? '')));

      React.useEffect(() => {
        setDisplay(mask(String(value ?? '')));
      }, [value]);

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = mask(e.currentTarget.value);
        setDisplay(masked);
        const syntheticEvent = {
          target: { value: toDigits(masked), name }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
      };

      return (
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          maxLength={maxLength}
          value={display}
          onChange={handleChange}
          onBlur={onBlur}
          name={name}
          disabled={disabled}
          className={className}
          {...props}
        />
      );
    }
  );
  Masked.displayName = displayName;
  return Masked;
}

// maxLength is the formatted width: CNPJ 18 (`00.000.000/0000-00`), phone 15 (`(00) 00000-0000`),
// CEP 9 (`00000-000`).
export const CnpjInput = createMaskedInput('CnpjInput', maskCnpj, 18, '00.000.000/0000-00');
export const PhoneInput = createMaskedInput('PhoneInput', maskPhone, 15, '(00) 00000-0000');
export const CepInput = createMaskedInput('CepInput', maskCep, 9, '00000-000');
