import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncomeBreakdown } from './IncomeBreakdown';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { IncomePivot } from './schema';

describe('IncomeBreakdown', () => {
  it('renders the pivot table with rows and totals', () => {
    const pivot: IncomePivot = {
      columns: [
        {
          key: 'contrib_1',
          label: 'Geral',
          groupKey: 'contribuicoes',
          groupLabel: 'Contribuições',
          parentGroupKey: 'contribuicoes',
          parentGroupLabel: 'Contribuições',
          total: '1000.00'
        },
        {
          key: 'contrib_2',
          label: 'Missões',
          groupKey: 'contribuicoes',
          groupLabel: 'Contribuições',
          parentGroupKey: 'contribuicoes',
          parentGroupLabel: 'Contribuições',
          total: '500.00'
        }
      ],
      rows: [
        {
          referenceDate: '2024-06-09',
          cells: { contrib_1: '600.00', contrib_2: '300.00' },
          total: '900.00'
        },
        {
          referenceDate: '2024-06-16',
          cells: { contrib_1: '400.00', contrib_2: '200.00' },
          total: '600.00'
        }
      ],
      grandTotal: '1500.00'
    };

    renderWithProviders(<IncomeBreakdown pivot={pivot} />);

    expect(screen.getByText('09/06/2024')).toBeInTheDocument();
    expect(screen.getByText('16/06/2024')).toBeInTheDocument();
    expect(screen.getByText('Total Entradas')).toBeInTheDocument();
  });

  it('displays amounts in Brazilian currency format', () => {
    const pivot: IncomePivot = {
      columns: [
        {
          key: 'contrib_1',
          label: 'Geral',
          groupKey: 'contribuicoes',
          groupLabel: 'Contribuições',
          parentGroupKey: 'contribuicoes',
          parentGroupLabel: 'Contribuições',
          total: '1000.00'
        }
      ],
      rows: [
        {
          referenceDate: '2024-06-09',
          cells: { contrib_1: '500.50' },
          total: '500.50'
        }
      ],
      grandTotal: '500.50'
    };

    renderWithProviders(<IncomeBreakdown pivot={pivot} />);

    // Should find at least one element with the formatted amount
    expect(screen.getAllByText((content) => content.includes('500,50')).length).toBeGreaterThan(0);
  });

  it('shows empty message when there are no rows', () => {
    const pivot: IncomePivot = {
      columns: [],
      rows: [],
      grandTotal: '0.00'
    };

    renderWithProviders(<IncomeBreakdown pivot={pivot} />);

    expect(screen.getByText('Nenhuma entrada no período.')).toBeInTheDocument();
  });

  it('shows empty message when there are no columns', () => {
    const pivot: IncomePivot = {
      columns: [],
      rows: [
        {
          referenceDate: '2024-06-09',
          cells: {},
          total: '0.00'
        }
      ],
      grandTotal: '0.00'
    };

    renderWithProviders(<IncomeBreakdown pivot={pivot} />);

    expect(screen.getByText('Nenhuma entrada no período.')).toBeInTheDocument();
  });

  it('toggles expandable bucket groups', async () => {
    const pivot: IncomePivot = {
      columns: [
        {
          key: 'contrib_1',
          label: 'Contribuição Geral',
          groupKey: 'contribuicoes',
          groupLabel: 'Contribuições',
          parentGroupKey: 'contribuicoes',
          parentGroupLabel: 'Contribuições',
          total: '600.00'
        },
        {
          key: 'contrib_2',
          label: 'Contribuição Missões',
          groupKey: 'contribuicoes',
          groupLabel: 'Contribuições',
          parentGroupKey: 'contribuicoes',
          parentGroupLabel: 'Contribuições',
          total: '300.00'
        }
      ],
      rows: [
        {
          referenceDate: '2024-06-09',
          cells: { contrib_1: '600.00', contrib_2: '300.00' },
          total: '900.00'
        }
      ],
      grandTotal: '900.00'
    };

    const user = userEvent.setup();
    renderWithProviders(<IncomeBreakdown pivot={pivot} />);

    expect(screen.getByText('Contribuições')).toBeInTheDocument();
    const toggleButton = screen.getByRole('button', { name: /Contribuições/i });
    await user.click(toggleButton);

    // After toggle, the detail rows should be hidden or shown
    expect(toggleButton).toHaveAttribute('aria-expanded');
  });

  it('displays group totals', () => {
    const pivot: IncomePivot = {
      columns: [
        {
          key: 'doacao_geral',
          label: 'Doação Geral',
          groupKey: 'doacao',
          groupLabel: 'Doações',
          parentGroupKey: 'outras-receitas',
          parentGroupLabel: 'Outras Receitas',
          total: '200.00'
        }
      ],
      rows: [
        {
          referenceDate: '2024-06-15',
          cells: { doacao_geral: '200.00' },
          total: '200.00'
        }
      ],
      grandTotal: '200.00'
    };

    renderWithProviders(<IncomeBreakdown pivot={pivot} />);

    expect(screen.getAllByText((content) => content.includes('200,00')).length).toBeGreaterThan(0);
  });

  it('formats dates correctly', () => {
    const pivot: IncomePivot = {
      columns: [
        {
          key: 'contrib_1',
          label: 'Geral',
          groupKey: 'contribuicoes',
          groupLabel: 'Contribuições',
          parentGroupKey: 'contribuicoes',
          parentGroupLabel: 'Contribuições',
          total: '500.00'
        }
      ],
      rows: [
        {
          referenceDate: '2024-01-07',
          cells: { contrib_1: '500.00' },
          total: '500.00'
        },
        {
          referenceDate: '2024-12-29',
          cells: { contrib_1: '300.00' },
          total: '300.00'
        }
      ],
      grandTotal: '800.00'
    };

    renderWithProviders(<IncomeBreakdown pivot={pivot} />);

    expect(screen.getByText('07/01/2024')).toBeInTheDocument();
    expect(screen.getByText('29/12/2024')).toBeInTheDocument();
  });
});
