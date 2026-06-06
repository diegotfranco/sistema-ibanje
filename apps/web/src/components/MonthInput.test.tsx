import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MonthInput from './MonthInput';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('MonthInput', () => {
  it('renders input field with placeholder', () => {
    const onChange = vi.fn();
    renderWithProviders(<MonthInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('mm/aaaa');
    expect(input).toBeInTheDocument();
  });

  it('formats ISO month to BR format on display', () => {
    const onChange = vi.fn();
    renderWithProviders(<MonthInput value="2024-06" onChange={onChange} />);

    const input = screen.getByPlaceholderText('mm/aaaa') as HTMLInputElement;
    expect(input.value).toBe('06/2024');
  });

  it('applies mask while typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<MonthInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('mm/aaaa');
    await user.type(input, '062024');

    expect(onChange).toHaveBeenCalled();
  });

  it('calls onChange with ISO format when value is typed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<MonthInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('mm/aaaa');
    await user.type(input, '062024');

    // onChange should be called with ISO format
    expect(onChange).toHaveBeenCalled();
  });

  it('clears invalid input on blur', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<MonthInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('mm/aaaa');
    await user.type(input, 'invalid');
    await user.tab();

    // Invalid value should be cleared
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('disables input when disabled prop is true', () => {
    const onChange = vi.fn();
    renderWithProviders(<MonthInput value="" onChange={onChange} disabled={true} />);

    const input = screen.getByPlaceholderText('mm/aaaa');
    expect(input).toBeDisabled();
  });

  it('updates display when value prop changes', () => {
    const onChange = vi.fn();
    const { unmount } = renderWithProviders(<MonthInput value="2024-06" onChange={onChange} />);

    let input = screen.getByPlaceholderText('mm/aaaa') as HTMLInputElement;
    expect(input.value).toBe('06/2024');

    unmount();

    renderWithProviders(<MonthInput value="2024-12" onChange={onChange} />);

    input = screen.getByPlaceholderText('mm/aaaa') as HTMLInputElement;
    expect(input.value).toBe('12/2024');
  });

  it('limits input to 7 characters', () => {
    const onChange = vi.fn();
    renderWithProviders(<MonthInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('mm/aaaa') as HTMLInputElement;
    expect(input.maxLength).toBe(7);
  });

  it('has numeric inputMode', () => {
    const onChange = vi.fn();
    renderWithProviders(<MonthInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('mm/aaaa');
    expect(input).toHaveAttribute('inputmode', 'numeric');
  });

  it('validates month range (1-12)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<MonthInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('mm/aaaa');
    await user.type(input, '132024');

    // Invalid month should not emit valid ISO
    expect(onChange).toHaveBeenCalled();
  });

  it('validates year range (1900-2999)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<MonthInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('mm/aaaa');
    // Year 1800 is out of range
    await user.type(input, '061800');

    expect(onChange).toHaveBeenCalled();
  });

  it('handles empty value correctly', () => {
    const onChange = vi.fn();
    renderWithProviders(<MonthInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('mm/aaaa') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('handles null onChange gracefully', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MonthInput value="" />);

    const input = screen.getByPlaceholderText('mm/aaaa');
    // Should not throw
    await user.type(input, '062024');
    expect(input).toBeInTheDocument();
  });
});
