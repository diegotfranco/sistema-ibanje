import * as React from 'react';
import { NumericFormat } from 'react-number-format';
import { Input } from '@/components/ui/input';

type Props = Omit<React.ComponentPropsWithoutRef<typeof Input>, 'value' | 'onChange'> & {
  value: string;
  onChange: (next: string) => void;
};

export default React.forwardRef<HTMLInputElement, Props>(
  ({ value, onChange, onBlur, type: _type, defaultValue: _defaultValue, ...props }, ref) => {
    return (
      <NumericFormat
        getInputRef={ref}
        customInput={Input}
        thousandSeparator="."
        decimalSeparator=","
        decimalScale={2}
        allowNegative={false}
        inputMode="decimal"
        value={value}
        onValueChange={({ value: raw }) => onChange(raw)}
        onBlur={onBlur}
        {...props}
      />
    );
  }
);
