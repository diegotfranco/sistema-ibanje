import * as React from 'react';
import { Input } from '@/components/ui/input';

type Props = Omit<React.ComponentPropsWithoutRef<typeof Input>, 'type'>;

export default React.forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <Input ref={ref} type="date" {...props} />;
});
