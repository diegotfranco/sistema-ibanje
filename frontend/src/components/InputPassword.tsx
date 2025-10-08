import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';
import { type InputHTMLAttributes } from 'react';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';

type InputPasswordProps = {
  showPassword: boolean;
  onToggleShowPassword: () => void;
} & InputHTMLAttributes<HTMLInputElement>;

export const InputPassword = ({ showPassword, onToggleShowPassword, ...props }: InputPasswordProps) => {
  return (
    <InputGroup>
      <InputGroupInput {...props} type={showPassword ? 'text' : 'password'} />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          aria-label="Mostrar senha"
          title="Mostrar senha"
          size="icon-xs"
          type="button"
          onClick={onToggleShowPassword}>
          {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
};
