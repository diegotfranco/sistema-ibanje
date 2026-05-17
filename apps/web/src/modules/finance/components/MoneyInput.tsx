import * as React from 'react';
import { Input } from '@/components/ui/input';

type Props = Omit<React.ComponentPropsWithoutRef<typeof Input>, 'value' | 'onChange'> & {
  value: string;
  onChange: (next: string) => void;
};

export default React.forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onBlur, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value;
      input = input.replace(/[^\d.]/g, '');
      const parts = input.split('.');
      if (parts.length > 2) {
        input = parts[0] + '.' + parts.slice(1).join('');
      }
      if (input.includes('.')) {
        const [whole, decimal] = input.split('.');
        input = whole + '.' + decimal.slice(0, 2);
      }
      onChange(input);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (value && value !== '') {
        const num = Number.parseFloat(value);
        if (!Number.isNaN(num)) {
          onChange(num.toFixed(2));
        }
      }
      onBlur?.(e);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        {...props}
      />
    );
  }
);
