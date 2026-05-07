import * as React from 'react';
import { Input } from '@/components/ui/input';

type Props = Omit<React.ComponentPropsWithoutRef<typeof Input>, 'type'>;

const MonthInput = React.forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <Input ref={ref} type="month" {...props} />;
});

MonthInput.displayName = 'MonthInput';

export default MonthInput;
