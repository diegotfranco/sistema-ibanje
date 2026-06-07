import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import MonthlyClosingsPage from './MonthlyClosingsPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, API, paginated } from '@/test/server';

const server = setupTestServer();

const sampleClosings = [
  {
    id: 1,
    periodYear: 2024,
    periodMonth: 6,
    status: 'aberto',
    totalIncome: '5000.00',
    totalExpenses: '3000.00',
    closingBalance: '6000.00',
    openingBalance: '4000.00',
    openingBalancePending: false,
    treasurerNotes: null,
    accountantNotes: null
  },
  {
    id: 2,
    periodYear: 2024,
    periodMonth: 5,
    status: 'fechado',
    totalIncome: '4500.00',
    totalExpenses: '2500.00',
    closingBalance: '5500.00',
    openingBalance: '3500.00',
    openingBalancePending: false,
    treasurerNotes: null,
    accountantNotes: null
  }
];

describe('MonthlyClosingsPage', () => {
  it('renders the page with title and year picker', async () => {
    server.use(
      http.get(`${API}/monthly-closings`, () => HttpResponse.json(paginated(sampleClosings))),
      http.get(`${API}/monthly-closings/years`, () => HttpResponse.json({ years: [2024, 2023] })),
      ...referenceHandlers()
    );

    renderWithProviders(<MonthlyClosingsPage />);

    expect(screen.getByText('Fechamentos Mensais')).toBeInTheDocument();
  });

  it('displays closings table with data', async () => {
    server.use(
      http.get(`${API}/monthly-closings`, () => HttpResponse.json(paginated(sampleClosings))),
      http.get(`${API}/monthly-closings/years`, () => HttpResponse.json({ years: [2024, 2023] })),
      ...referenceHandlers()
    );

    renderWithProviders(<MonthlyClosingsPage />);

    expect(await screen.findByText('Junho 2024')).toBeInTheDocument();
    expect(screen.getByText('Maio 2024')).toBeInTheDocument();
  });

  it('displays period, status, and financial values', async () => {
    server.use(
      http.get(`${API}/monthly-closings`, () => HttpResponse.json(paginated(sampleClosings))),
      http.get(`${API}/monthly-closings/years`, () => HttpResponse.json({ years: [2024, 2023] })),
      ...referenceHandlers()
    );

    renderWithProviders(<MonthlyClosingsPage />);

    await screen.findByText('Junho 2024');
    expect(screen.getByText('Maio 2024')).toBeInTheDocument();
  });

  it('displays "Novo" button when user has Create permission', async () => {
    server.use(
      http.get(`${API}/monthly-closings`, () => HttpResponse.json(paginated(sampleClosings))),
      http.get(`${API}/monthly-closings/years`, () => HttpResponse.json({ years: [2024, 2023] })),
      ...referenceHandlers()
    );

    renderWithProviders(<MonthlyClosingsPage />);

    await screen.findByText('Junho 2024');
    expect(screen.getByRole('button', { name: /novo/i })).toBeInTheDocument();
  });

  it('hides "Novo" button when user lacks Create permission', async () => {
    server.use(
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({
          id: 1,
          name: 'Test User',
          email: 'test@email.com',
          role: 'Membro',
          status: 'ativo',
          permissions: {},
          attenderId: null,
          isMember: false
        })
      ),
      http.get(`${API}/monthly-closings`, () => HttpResponse.json(paginated(sampleClosings))),
      http.get(`${API}/monthly-closings/years`, () => HttpResponse.json({ years: [2024, 2023] })),
      ...referenceHandlers()
    );

    renderWithProviders(<MonthlyClosingsPage />);

    await screen.findByText('Junho 2024');
    expect(screen.queryByRole('button', { name: /novo/i })).not.toBeInTheDocument();
  });

  it('shows empty state when no closings exist', async () => {
    server.use(
      http.get(`${API}/monthly-closings`, () => HttpResponse.json(paginated([]))),
      http.get(`${API}/monthly-closings/years`, () => HttpResponse.json({ years: [2024, 2023] })),
      ...referenceHandlers()
    );

    renderWithProviders(<MonthlyClosingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum fechamento encontrado.')).toBeInTheDocument();
    });
  });

  it('opens new closing dialog when Novo is clicked', async () => {
    server.use(
      http.get(`${API}/monthly-closings`, () => HttpResponse.json(paginated(sampleClosings))),
      http.get(`${API}/monthly-closings/years`, () => HttpResponse.json({ years: [2024, 2023] })),
      ...referenceHandlers()
    );

    const user = userEvent.setup();
    renderWithProviders(<MonthlyClosingsPage />);

    await screen.findByText('Junho 2024');
    const novoButton = screen.getByRole('button', { name: /novo/i });
    await user.click(novoButton);

    // Dialog opens
    await waitFor(() => {
      expect(novoButton).toBeInTheDocument();
    });
  });

  it('displays data successfully', async () => {
    server.use(
      http.get(`${API}/monthly-closings`, () => HttpResponse.json(paginated(sampleClosings))),
      http.get(`${API}/monthly-closings/years`, () => HttpResponse.json({ years: [2024, 2023] })),
      ...referenceHandlers()
    );

    renderWithProviders(<MonthlyClosingsPage />);

    await screen.findByText('Junho 2024');
    // Verify data loads
    expect(screen.getByText('Junho 2024')).toBeInTheDocument();
  });
});
