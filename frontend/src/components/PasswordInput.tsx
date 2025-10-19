import { useState, type InputHTMLAttributes } from 'react';
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

type PasswordInputProps = InputHTMLAttributes<HTMLInputElement>;

export const PasswordInput = (props: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <InputGroup>
      <InputGroupInput
        {...props}
        type={showPassword ? 'text' : 'password'}
        data-slot="input-group-control"
        maxLength={64}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          size="icon-xs"
          onClick={() => setShowPassword((prev) => !prev)}>
          {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
};
