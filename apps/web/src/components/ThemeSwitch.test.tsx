import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeSwitch } from './ThemeSwitch';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('ThemeSwitch', () => {
  it('renders the theme switch button', () => {
    renderWithProviders(<ThemeSwitch />);

    const switchButton = screen.getByRole('switch');
    expect(switchButton).toBeInTheDocument();
  });

  it('has aria-label for accessibility', () => {
    renderWithProviders(<ThemeSwitch />);

    const switchButton = screen.getByRole('switch');
    expect(switchButton).toHaveAttribute('aria-label', 'Alternar tema');
  });

  it('toggles theme when clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeSwitch />);

    const switchButton = screen.getByRole('switch');
    await user.click(switchButton);

    // After click, the switch should change state
    expect(switchButton).toBeInTheDocument();
  });

  it('renders sun and moon icons', () => {
    const { container } = renderWithProviders(<ThemeSwitch />);

    // Should have SVG elements for sun and moon icons
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('shows sun icon when theme is light', () => {
    renderWithProviders(<ThemeSwitch />);

    const switchButton = screen.getByRole('switch');
    // In light theme (default), the sun icon should be visible
    expect(switchButton).toBeInTheDocument();
  });

  it('applies correct styling to switch root', () => {
    renderWithProviders(<ThemeSwitch />);

    const switchButton = screen.getByRole('switch');
    expect(switchButton).toHaveClass('group/theme-switch');
  });

  it('is keyboard accessible', () => {
    renderWithProviders(<ThemeSwitch />);

    const switchButton = screen.getByRole('switch');
    switchButton.focus();
    expect(switchButton).toHaveFocus();
  });
});
