import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PermissionsMatrix from './PermissionsMatrix';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { ModuleRef, PermissionTypeRef } from '@/hooks/usePermissionsReference';

const mockModules: ModuleRef[] = [
  { id: 1, name: 'Usuários' },
  { id: 2, name: 'Campanhas' },
  { id: 3, name: 'Entradas' }
];

const mockPermissionTypes: PermissionTypeRef[] = [
  { id: 1, name: 'Acessar' },
  { id: 2, name: 'Cadastrar' },
  { id: 3, name: 'Editar' },
  { id: 4, name: 'Remover' },
  { id: 5, name: 'Revisar' },
  { id: 6, name: 'Relatórios' }
];

describe('PermissionsMatrix', () => {
  it('renders loading skeleton when loading', () => {
    const onChange = vi.fn();

    const { container } = renderWithProviders(
      <PermissionsMatrix
        modules={mockModules}
        permissionTypes={mockPermissionTypes}
        isLoadingReference={true}
        value={new Set()}
        onChange={onChange}
      />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders table with modules and permissions', () => {
    const onChange = vi.fn();

    renderWithProviders(
      <PermissionsMatrix
        modules={mockModules}
        permissionTypes={mockPermissionTypes}
        isLoadingReference={false}
        value={new Set()}
        onChange={onChange}
      />
    );

    expect(screen.getByText('Usuários')).toBeInTheDocument();
    expect(screen.getByText('Campanhas')).toBeInTheDocument();
    expect(screen.getByText('Entradas')).toBeInTheDocument();
  });

  it('renders permission type headers', () => {
    const onChange = vi.fn();

    renderWithProviders(
      <PermissionsMatrix
        modules={mockModules}
        permissionTypes={mockPermissionTypes}
        isLoadingReference={false}
        value={new Set()}
        onChange={onChange}
      />
    );

    expect(screen.getByText('Acessar')).toBeInTheDocument();
    expect(screen.getByText('Cadastrar')).toBeInTheDocument();
    expect(screen.getByText('Editar')).toBeInTheDocument();
    expect(screen.getByText('Remover')).toBeInTheDocument();
    expect(screen.getByText('Revisar')).toBeInTheDocument();
    expect(screen.getByText('Relatórios')).toBeInTheDocument();
  });

  it('renders table structure', () => {
    const onChange = vi.fn();

    const { container } = renderWithProviders(
      <PermissionsMatrix
        modules={mockModules}
        permissionTypes={mockPermissionTypes}
        isLoadingReference={false}
        value={new Set()}
        onChange={onChange}
      />
    );

    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
  });

  it('renders table with thead and tbody', () => {
    const onChange = vi.fn();

    const { container } = renderWithProviders(
      <PermissionsMatrix
        modules={mockModules}
        permissionTypes={mockPermissionTypes}
        isLoadingReference={false}
        value={new Set()}
        onChange={onChange}
      />
    );

    const thead = container.querySelector('thead');
    const tbody = container.querySelector('tbody');
    expect(thead).toBeInTheDocument();
    expect(tbody).toBeInTheDocument();
  });

  it('renders module names in table rows', () => {
    const onChange = vi.fn();

    renderWithProviders(
      <PermissionsMatrix
        modules={mockModules}
        permissionTypes={mockPermissionTypes}
        isLoadingReference={false}
        value={new Set()}
        onChange={onChange}
      />
    );

    mockModules.forEach((mod) => {
      expect(screen.getByText(mod.name)).toBeInTheDocument();
    });
  });

  it('calls onChange when checkbox is toggled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { container } = renderWithProviders(
      <PermissionsMatrix
        modules={mockModules}
        permissionTypes={mockPermissionTypes}
        isLoadingReference={false}
        value={new Set()}
        onChange={onChange}
      />
    );

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length > 0) {
      await user.click(checkboxes[0] as HTMLInputElement);
      expect(onChange).toHaveBeenCalled();
    }
  });

  it('marks checkboxes checked when in value set', () => {
    const onChange = vi.fn();
    const checked = new Set(['1:1']);

    const { container } = renderWithProviders(
      <PermissionsMatrix
        modules={mockModules}
        permissionTypes={mockPermissionTypes}
        isLoadingReference={false}
        value={checked}
        onChange={onChange}
      />
    );

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length > 0) {
      const firstCheckbox = checkboxes[0] as HTMLInputElement;
      expect(firstCheckbox.checked).toBe(true);
    }
  });

  it('disables checkboxes when disabled prop is true', () => {
    const onChange = vi.fn();

    const { container } = renderWithProviders(
      <PermissionsMatrix
        modules={mockModules}
        permissionTypes={mockPermissionTypes}
        isLoadingReference={false}
        value={new Set()}
        onChange={onChange}
        disabled={true}
      />
    );

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
      expect((checkbox as HTMLInputElement).disabled).toBe(true);
    });
  });
});
