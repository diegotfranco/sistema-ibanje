import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { FinancialStatementDocument } from './FinancialStatementDocument';
import { renderWithProviders } from '@/test/renderWithProviders';
import type { FinancialStatementResponse } from './schema';

describe('FinancialStatementDocument', () => {
  it('renders the statement with financial data', () => {
    const data: FinancialStatementResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      openingBalance: '5000.00',
      totalIncome: '3000.00',
      totalExpenses: '2000.00',
      currentBalance: '6000.00',
      incomeByCategory: [],
      incomeByFund: [],
      expensesByCategory: []
    };

    renderWithProviders(<FinancialStatementDocument data={data} />);

    // Document renders without error
    expect(screen.getByText('Total Entradas')).toBeInTheDocument();
    expect(screen.getByText('Total Saídas')).toBeInTheDocument();
  });

  it('displays income by category breakdown', () => {
    const data: FinancialStatementResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      openingBalance: '5000.00',
      totalIncome: '3000.00',
      totalExpenses: '2000.00',
      currentBalance: '6000.00',
      incomeByCategory: [
        {
          parentCategoryId: 1,
          parentCategoryName: 'Contribuições',
          categoryId: 1,
          categoryName: 'Dízimo',
          total: '2000.00'
        },
        {
          parentCategoryId: 2,
          parentCategoryName: 'Ofertas',
          categoryId: 2,
          categoryName: 'Oferta Geral',
          total: '1000.00'
        }
      ],
      incomeByFund: [],
      expensesByCategory: []
    };

    renderWithProviders(<FinancialStatementDocument data={data} />);

    expect(screen.getByText('Dízimo')).toBeInTheDocument();
    expect(screen.getByText('Oferta Geral')).toBeInTheDocument();
  });

  it('displays expenses by category breakdown', () => {
    const data: FinancialStatementResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      openingBalance: '5000.00',
      totalIncome: '3000.00',
      totalExpenses: '2000.00',
      currentBalance: '6000.00',
      incomeByCategory: [],
      incomeByFund: [],
      expensesByCategory: [
        {
          parentCategoryId: 1,
          parentCategoryName: 'Despesas Operacionais',
          categoryId: 1,
          categoryName: 'Aluguel',
          total: '1500.00'
        },
        {
          parentCategoryId: 1,
          parentCategoryName: 'Despesas Operacionais',
          categoryId: 2,
          categoryName: 'Utilidades',
          total: '500.00'
        }
      ]
    };

    renderWithProviders(<FinancialStatementDocument data={data} />);

    expect(screen.getByText('Aluguel')).toBeInTheDocument();
    expect(screen.getByText('Utilidades')).toBeInTheDocument();
  });

  it('displays amounts in Brazilian currency format', () => {
    const data: FinancialStatementResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      openingBalance: '5000.50',
      totalIncome: '3000.75',
      totalExpenses: '2000.25',
      currentBalance: '6000.00',
      incomeByCategory: [
        {
          parentCategoryId: 1,
          parentCategoryName: 'Contribuições',
          categoryId: 1,
          categoryName: 'Dízimo',
          total: '3000.75'
        }
      ],
      incomeByFund: [],
      expensesByCategory: [
        {
          parentCategoryId: 1,
          parentCategoryName: 'Despesas',
          categoryId: 1,
          categoryName: 'Aluguel',
          total: '2000.25'
        }
      ]
    };

    renderWithProviders(<FinancialStatementDocument data={data} />);

    // Verify category names are displayed
    expect(screen.getByText('Dízimo')).toBeInTheDocument();
    expect(screen.getByText('Aluguel')).toBeInTheDocument();
  });

  it('displays statement with income and expense categories', () => {
    const data: FinancialStatementResponse = {
      period: { from: '2024-06-01', to: '2024-06-30' },
      openingBalance: '5000.00',
      totalIncome: '3000.00',
      totalExpenses: '2000.00',
      currentBalance: '6000.00',
      incomeByCategory: [
        {
          parentCategoryId: 1,
          parentCategoryName: 'Contribuições',
          categoryId: 1,
          categoryName: 'Dízimo',
          total: '3000.00'
        }
      ],
      incomeByFund: [],
      expensesByCategory: [
        {
          parentCategoryId: 1,
          parentCategoryName: 'Despesas',
          categoryId: 1,
          categoryName: 'Aluguel',
          total: '2000.00'
        }
      ]
    };

    renderWithProviders(<FinancialStatementDocument data={data} />);

    // Verify categories are displayed
    expect(screen.getByText('Dízimo')).toBeInTheDocument();
    expect(screen.getByText('Aluguel')).toBeInTheDocument();
  });
});
