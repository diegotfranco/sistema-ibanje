import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CnpjInput, PhoneInput, CepInput } from './MaskedInput';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('MaskedInput', () => {
  it('CnpjInput renders the stored digits as a formatted value', () => {
    renderWithProviders(<CnpjInput value="15556152000142" onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('00.000.000/0000-00') as HTMLInputElement;
    expect(input.value).toBe('15.556.152/0001-42');
  });

  it('CnpjInput emits raw digits via onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<CnpjInput value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText('00.000.000/0000-00');
    await user.type(input, '1');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ target: expect.objectContaining({ value: '1' }) })
    );
  });

  it('PhoneInput formats a mobile number on display', () => {
    renderWithProviders(<PhoneInput value="11999998888" onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText('(00) 00000-0000') as HTMLInputElement;
    expect(input.value).toBe('(11) 99999-8888');
  });

  it('PhoneInput re-syncs display when the value prop changes', () => {
    const { unmount } = renderWithProviders(<PhoneInput value="1127414262" onChange={vi.fn()} />);
    let input = screen.getByPlaceholderText('(00) 00000-0000') as HTMLInputElement;
    expect(input.value).toBe('(11) 2741-4262');
    unmount();
    renderWithProviders(<PhoneInput value="11999998888" onChange={vi.fn()} />);
    input = screen.getByPlaceholderText('(00) 00000-0000') as HTMLInputElement;
    expect(input.value).toBe('(11) 99999-8888');
  });

  it('CepInput formats and emits raw digits', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<CepInput value="" onChange={onChange} />);
    const input = screen.getByPlaceholderText('00000-000') as HTMLInputElement;
    await user.type(input, '03446000');
    expect(input.value).toBe('03446-000');
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ target: expect.objectContaining({ value: '03446000' }) })
    );
  });

  it('has numeric inputMode', () => {
    renderWithProviders(<CepInput value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('00000-000')).toHaveAttribute('inputmode', 'numeric');
  });
});
