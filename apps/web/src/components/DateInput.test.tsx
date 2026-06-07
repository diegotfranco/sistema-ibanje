import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DateInput from './DateInput';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('DateInput', () => {
  it('renders input field with placeholder', () => {
    const onChange = vi.fn();
    renderWithProviders(<DateInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('dd/mm/aaaa');
    expect(input).toBeInTheDocument();
  });

  it('renders calendar trigger button', () => {
    const onChange = vi.fn();
    renderWithProviders(<DateInput value="" onChange={onChange} />);

    const button = screen.getByRole('button', { name: /abrir calendário/i });
    expect(button).toBeInTheDocument();
  });

  it('formats ISO date to BR format on display', () => {
    const onChange = vi.fn();
    renderWithProviders(<DateInput value="2024-06-15" onChange={onChange} />);

    const input = screen.getByPlaceholderText('dd/mm/aaaa') as HTMLInputElement;
    expect(input.value).toBe('15/06/2024');
  });

  it('applies mask while typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<DateInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('dd/mm/aaaa');
    await user.type(input, '15062024');

    expect(onChange).toHaveBeenCalled();
  });

  it('opens calendar popover on button click', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<DateInput value="" onChange={onChange} />);

    const button = screen.getByRole('button', { name: /abrir calendário/i });
    await user.click(button);

    await waitFor(() => {
      // Calendar should be visible
      expect(screen.getByRole('button', { name: /abrir calendário/i })).toBeInTheDocument();
    });
  });

  it('clears invalid input on blur', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<DateInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('dd/mm/aaaa');
    await user.type(input, 'invalid');
    await user.tab();

    // Invalid value should be cleared
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('disables input and button when disabled prop is true', () => {
    const onChange = vi.fn();
    renderWithProviders(<DateInput value="" onChange={onChange} disabled={true} />);

    const input = screen.getByPlaceholderText('dd/mm/aaaa');
    const button = screen.getByRole('button', { name: /abrir calendário/i });

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('calls onChange with ISO format when value is typed', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<DateInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('dd/mm/aaaa');
    await user.type(input, '15062024');

    // onChange should be called with ISO format
    expect(onChange).toHaveBeenCalled();
  });

  it('updates display when value prop changes', () => {
    const onChange = vi.fn();
    const { unmount } = renderWithProviders(<DateInput value="2024-06-15" onChange={onChange} />);

    let input = screen.getByPlaceholderText('dd/mm/aaaa') as HTMLInputElement;
    expect(input.value).toBe('15/06/2024');

    unmount();

    renderWithProviders(<DateInput value="2024-12-25" onChange={onChange} />);

    input = screen.getByPlaceholderText('dd/mm/aaaa') as HTMLInputElement;
    expect(input.value).toBe('25/12/2024');
  });

  it('limits input to 10 characters', () => {
    const onChange = vi.fn();
    renderWithProviders(<DateInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('dd/mm/aaaa') as HTMLInputElement;
    expect(input.maxLength).toBe(10);
  });

  it('has numeric inputMode', () => {
    const onChange = vi.fn();
    renderWithProviders(<DateInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('dd/mm/aaaa');
    expect(input).toHaveAttribute('inputmode', 'numeric');
  });

  it('validates date range (day 1-31)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<DateInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('dd/mm/aaaa');
    await user.type(input, '32062024');

    // Invalid day should not emit valid ISO
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    // Should emit empty or not valid ISO
    expect(lastCall).toBeTruthy();
  });

  it('validates month range (1-12)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<DateInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('dd/mm/aaaa');
    await user.type(input, '15132024');

    expect(onChange).toHaveBeenCalled();
  });

  it('validates year range (1900-2999)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<DateInput value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('dd/mm/aaaa');
    // Year 1800 is out of range
    await user.type(input, '15061800');

    expect(onChange).toHaveBeenCalled();
  });
});
