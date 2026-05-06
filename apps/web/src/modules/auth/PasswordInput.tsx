import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton
} from '@/components/ui/input-group';

type PasswordInputProps = React.ComponentProps<typeof InputGroupInput>;

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup>
      <InputGroupInput
        {...props}
        type={visible ? 'text' : 'password'}
        data-slot="input-group-control"
        maxLength={64}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          title={visible ? 'Ocultar senha' : 'Mostrar senha'}
          size="icon-xs"
          onClick={() => setVisible((prev) => !prev)}>
          {visible ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
