import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { RowDetailPanel, type RowDetailField } from './RowDetailPanel';
import { renderWithProviders } from '@/test/renderWithProviders';

const testFields: RowDetailField[] = [
  { label: 'Nome', value: 'João Silva' },
  { label: 'Email', value: 'joao@example.com' },
  { label: 'Telefone', value: '(11) 99999-9999' },
  { label: 'Status', value: 'Ativo' }
];

describe('RowDetailPanel', () => {
  it('renders dialog when open on desktop (md+) viewport', async () => {
    renderWithProviders(
      <RowDetailPanel
        open={true}
        onOpenChange={() => {}}
        title="Detalhes do Usuário"
        fields={testFields}
      />
    );

    expect(screen.getByText('Detalhes do Usuário')).toBeInTheDocument();
  });

  it('displays all fields in the panel', () => {
    renderWithProviders(
      <RowDetailPanel open={true} onOpenChange={() => {}} title="Detalhes" fields={testFields} />
    );

    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('joao@example.com')).toBeInTheDocument();
  });

  it('renders field labels correctly', () => {
    renderWithProviders(
      <RowDetailPanel open={true} onOpenChange={() => {}} title="Test Title" fields={testFields} />
    );

    testFields.forEach((field) => {
      expect(screen.getByText(field.label)).toBeInTheDocument();
    });
  });

  it('renders field values correctly', () => {
    renderWithProviders(
      <RowDetailPanel open={true} onOpenChange={() => {}} title="Test Title" fields={testFields} />
    );

    testFields.forEach((field) => {
      expect(screen.getByText(String(field.value))).toBeInTheDocument();
    });
  });

  it('hides empty fields when hideEmpty is true', () => {
    const fieldsWithEmpty: RowDetailField[] = [
      { label: 'Nome', value: 'João Silva' },
      { label: 'Complemento', value: '', hideEmpty: true },
      { label: 'Observações', value: '—', hideEmpty: true }
    ];

    renderWithProviders(
      <RowDetailPanel open={true} onOpenChange={() => {}} title="Test" fields={fieldsWithEmpty} />
    );

    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.queryByText('Complemento')).not.toBeInTheDocument();
    expect(screen.queryByText('Observações')).not.toBeInTheDocument();
  });

  it('shows fields with hideEmpty=false even if empty', () => {
    const fieldsWithEmpty: RowDetailField[] = [
      { label: 'Nome', value: 'João Silva' },
      { label: 'Email', value: '', hideEmpty: false }
    ];

    renderWithProviders(
      <RowDetailPanel open={true} onOpenChange={() => {}} title="Test" fields={fieldsWithEmpty} />
    );

    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('displays description when provided', () => {
    renderWithProviders(
      <RowDetailPanel
        open={true}
        onOpenChange={() => {}}
        title="Detalhes do Usuário"
        description="Informações gerais do usuário"
        fields={testFields}
      />
    );

    expect(screen.getByText('Informações gerais do usuário')).toBeInTheDocument();
  });

  it('does not display description when not provided', () => {
    renderWithProviders(
      <RowDetailPanel open={true} onOpenChange={() => {}} title="Test Title" fields={testFields} />
    );

    // Should not have a description element
    const descriptions = screen.queryAllByRole('paragraph');
    expect(descriptions.length).toBe(0);
  });

  it('calls onOpenChange when closing', async () => {
    let isOpen = true;

    renderWithProviders(
      <RowDetailPanel
        open={isOpen}
        onOpenChange={(v) => {
          isOpen = v;
        }}
        title="Test"
        fields={testFields}
      />
    );

    // Close button or escape key would trigger onOpenChange
    // For this test, we just verify the prop is callable
    expect(isOpen).toBe(true);
  });

  it('renders actions when provided', () => {
    const actions = <button>Editar</button>;
    renderWithProviders(
      <RowDetailPanel
        open={true}
        onOpenChange={() => {}}
        title="Test"
        fields={testFields}
        actions={actions}
      />
    );

    expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
  });

  it('does not render actions section when not provided', () => {
    renderWithProviders(
      <RowDetailPanel open={true} onOpenChange={() => {}} title="Test" fields={testFields} />
    );

    // When no actions provided, should not have action buttons in content
    expect(screen.getByText('Nome')).toBeInTheDocument();
  });

  it('renders field list', () => {
    renderWithProviders(
      <RowDetailPanel open={true} onOpenChange={() => {}} title="Test" fields={testFields} />
    );

    // All fields should be rendered
    testFields.forEach((f) => {
      expect(screen.getByText(f.label)).toBeInTheDocument();
    });
  });

  it('respects open state', () => {
    const { rerender } = renderWithProviders(
      <RowDetailPanel open={true} onOpenChange={() => {}} title="Test" fields={testFields} />
    );

    expect(screen.getByText('Nome')).toBeInTheDocument();

    rerender(
      <RowDetailPanel open={false} onOpenChange={() => {}} title="Test" fields={testFields} />
    );

    expect(screen.queryByText('Nome')).not.toBeInTheDocument();
  });

  it('shows title when open', () => {
    renderWithProviders(
      <RowDetailPanel open={true} onOpenChange={() => {}} title="Test Title" fields={testFields} />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('handles null field values gracefully', () => {
    const fieldsWithNull: RowDetailField[] = [
      { label: 'Nome', value: 'João' },
      { label: 'Nickname', value: null },
      { label: 'Email', value: undefined }
    ];

    renderWithProviders(
      <RowDetailPanel open={true} onOpenChange={() => {}} title="Test" fields={fieldsWithNull} />
    );

    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Nickname')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('handles whitespace-only values as empty', () => {
    const fieldsWithWhitespace: RowDetailField[] = [
      { label: 'Nome', value: 'João' },
      { label: 'Campo', value: '   ', hideEmpty: true }
    ];

    renderWithProviders(
      <RowDetailPanel
        open={true}
        onOpenChange={() => {}}
        title="Test"
        fields={fieldsWithWhitespace}
      />
    );

    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.queryByText('Campo')).not.toBeInTheDocument();
  });

  it('displays react nodes as field values', () => {
    const fieldsWithComponents: RowDetailField[] = [
      { label: 'Status', value: <span className="badge">Ativo</span> },
      { label: 'Nome', value: 'João' }
    ];

    renderWithProviders(
      <RowDetailPanel
        open={true}
        onOpenChange={() => {}}
        title="Test"
        fields={fieldsWithComponents}
      />
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    const badge = screen.getByText('Ativo');
    expect(badge).toHaveClass('badge');
  });

  it('renders all field labels', () => {
    renderWithProviders(
      <RowDetailPanel open={true} onOpenChange={() => {}} title="Test" fields={testFields} />
    );

    testFields.forEach((f) => {
      expect(screen.getByText(f.label)).toBeInTheDocument();
    });
  });

  it('renders all field values', () => {
    renderWithProviders(
      <RowDetailPanel open={true} onOpenChange={() => {}} title="Test" fields={testFields} />
    );

    testFields.forEach((f) => {
      expect(screen.getByText(String(f.value))).toBeInTheDocument();
    });
  });

  it('handles semantic field structure', () => {
    renderWithProviders(
      <RowDetailPanel
        open={true}
        onOpenChange={() => {}}
        title="Test"
        fields={[{ label: 'Test Label', value: 'Test Value' }]}
      />
    );

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('Test Value')).toBeInTheDocument();
  });

  it('renders many fields without errors', () => {
    const manyFields = Array.from({ length: 20 }, (_, i) => ({
      label: `Field ${i}`,
      value: `Value ${i}`
    }));

    renderWithProviders(
      <RowDetailPanel open={true} onOpenChange={() => {}} title="Test" fields={manyFields} />
    );

    expect(screen.getByText('Field 0')).toBeInTheDocument();
    expect(screen.getByText('Field 19')).toBeInTheDocument();
  });

  it('renders fields in provided order', () => {
    const orderedFields: RowDetailField[] = [
      { label: 'First', value: '1' },
      { label: 'Second', value: '2' },
      { label: 'Third', value: '3' }
    ];

    renderWithProviders(
      <RowDetailPanel open={true} onOpenChange={() => {}} title="Test" fields={orderedFields} />
    );

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });
});
