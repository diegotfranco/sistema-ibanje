import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import EntityPicker from './EntityPicker';
import { renderWithProviders } from '@/test/renderWithProviders';

interface TestEntity {
  id: number;
  name: string;
}

const testItems: TestEntity[] = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' }
];

describe('EntityPicker', () => {
  it('renders with placeholder text by default', () => {
    renderWithProviders(
      <EntityPicker
        items={testItems}
        value={null}
        onChange={() => {}}
        getValue={(item) => item.id}
        getLabel={(item) => item.name}
      />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent('Selecionar...');
  });

  it('renders with custom placeholder', () => {
    renderWithProviders(
      <EntityPicker
        items={testItems}
        value={null}
        onChange={() => {}}
        getValue={(item) => item.id}
        getLabel={(item) => item.name}
        placeholder="Escolha uma opção"
      />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent('Escolha uma opção');
  });

  it('displays selected item name', () => {
    renderWithProviders(
      <EntityPicker
        items={testItems}
        value={1}
        onChange={() => {}}
        getValue={(item) => item.id}
        getLabel={(item) => item.name}
      />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent('Item 1');
  });

  it('renders as a combobox button', () => {
    renderWithProviders(
      <EntityPicker
        items={testItems}
        value={null}
        onChange={() => {}}
        getValue={(item) => item.id}
        getLabel={(item) => item.name}
      />
    );

    const button = screen.getByRole('combobox');
    expect(button).toBeTruthy();
    expect(button.getAttribute('role')).toBe('combobox');
  });

  it('starts with aria-expanded false', () => {
    renderWithProviders(
      <EntityPicker
        items={testItems}
        value={null}
        onChange={() => {}}
        getValue={(item) => item.id}
        getLabel={(item) => item.name}
      />
    );

    const button = screen.getByRole('combobox');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('disables button when disabled prop is true', () => {
    renderWithProviders(
      <EntityPicker
        items={testItems}
        value={null}
        onChange={() => {}}
        getValue={(item) => item.id}
        getLabel={(item) => item.name}
        disabled={true}
      />
    );

    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('does not disable button when disabled prop is false', () => {
    renderWithProviders(
      <EntityPicker
        items={testItems}
        value={null}
        onChange={() => {}}
        getValue={(item) => item.id}
        getLabel={(item) => item.name}
        disabled={false}
      />
    );

    expect(screen.getByRole('combobox')).not.toBeDisabled();
  });

  it('applies custom className prop', () => {
    renderWithProviders(
      <EntityPicker
        items={testItems}
        value={null}
        onChange={() => {}}
        getValue={(item) => item.id}
        getLabel={(item) => item.name}
        className="custom-class"
      />
    );

    const button = screen.getByRole('combobox');
    expect(button).toHaveClass('custom-class');
  });

  it('accepts all item types via getValue', () => {
    const items = [
      { id: 10, label: 'Alpha' },
      { id: 20, label: 'Beta' }
    ];

    renderWithProviders(
      <EntityPicker
        items={items}
        value={10}
        onChange={() => {}}
        getValue={(item) => item.id}
        getLabel={(item) => item.label}
      />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent('Alpha');
  });

  it('handles empty items array', () => {
    renderWithProviders(
      <EntityPicker
        items={[] as TestEntity[]}
        value={null}
        onChange={() => {}}
        getValue={(item) => item.id}
        getLabel={(item) => item.name}
      />
    );

    expect(screen.getByRole('combobox')).toBeTruthy();
  });

  it('handles null value', () => {
    renderWithProviders(
      <EntityPicker
        items={testItems}
        value={null}
        onChange={() => {}}
        getValue={(item) => item.id}
        getLabel={(item) => item.name}
      />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent('Selecionar...');
  });

  it('handles selectedItem not found in items', () => {
    renderWithProviders(
      <EntityPicker
        items={testItems}
        value={999}
        onChange={() => {}}
        getValue={(item) => item.id}
        getLabel={(item) => item.name}
      />
    );

    // Should fall back to placeholder when item not found
    const button = screen.getByRole('combobox');
    expect(button).toBeInTheDocument();
  });

  it('renders with isLoading state', () => {
    renderWithProviders(
      <EntityPicker
        items={testItems}
        value={null}
        onChange={() => {}}
        getValue={(item) => item.id}
        getLabel={(item) => item.name}
        isLoading={true}
      />
    );

    // Button should still render when loading
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders with allowClear true', () => {
    renderWithProviders(
      <EntityPicker
        items={testItems}
        value={1}
        onChange={() => {}}
        getValue={(item) => item.id}
        getLabel={(item) => item.name}
        allowClear={true}
      />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent('Item 1');
  });

  it('renders with allowClear false', () => {
    renderWithProviders(
      <EntityPicker
        items={testItems}
        value={1}
        onChange={() => {}}
        getValue={(item) => item.id}
        getLabel={(item) => item.name}
        allowClear={false}
      />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent('Item 1');
  });

  it('handles forwardRef properly', () => {
    const ref = { current: null } as unknown as React.RefObject<HTMLButtonElement>;
    renderWithProviders(
      <EntityPicker
        ref={ref}
        items={testItems}
        value={null}
        onChange={() => {}}
        getValue={(item) => item.id}
        getLabel={(item) => item.name}
      />
    );

    expect(ref.current).toBeTruthy();
  });

  it('accepts custom emptyMessage', () => {
    renderWithProviders(
      <EntityPicker
        items={[] as TestEntity[]}
        value={null}
        onChange={() => {}}
        getValue={(item) => item.id}
        getLabel={(item) => item.name}
        emptyMessage="Custom empty message"
      />
    );

    // Component renders without error
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
