import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { IncomeEntryForm } from './IncomeEntryForm';
import { renderWithProviders } from '@/test/renderWithProviders';
import { invalidateCsrfToken } from '@/lib/api';

const BASE = 'http://localhost/api';
const emptyPage = { data: [], total: 0, page: 1, limit: 200, totalPages: 0 };

// Reference-data lookups the form fans out to on mount. /events is the one the form requests with
// limit=200 while the backend caps it at 100 — in production that returns 400. This test pins the
// CURRENT degradation contract: a failed events lookup must NOT crash the form; the dropdown just
// comes up empty. When the limit mismatch is fixed, this test still passes (empty vs full list).
function handlers(opts: { eventsStatus?: number } = {}) {
  return [
    http.get(`${BASE}/income-categories`, () => HttpResponse.json(emptyPage)),
    http.get(`${BASE}/payment-methods`, () => HttpResponse.json(emptyPage)),
    http.get(`${BASE}/designated-funds`, () => HttpResponse.json(emptyPage)),
    http.get(`${BASE}/attenders`, () => HttpResponse.json(emptyPage)),
    http.get(`${BASE}/events`, () =>
      opts.eventsStatus
        ? HttpResponse.json({ message: 'Bad Request' }, { status: opts.eventsStatus })
        : HttpResponse.json(emptyPage)
    )
  ];
}

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  invalidateCsrfToken();
});
afterAll(() => server.close());

const noop = () => {};

describe('IncomeEntryForm reference-data degradation', () => {
  it('renders the form even when the events lookup fails (limit=200 → 400)', async () => {
    server.use(...handlers({ eventsStatus: 400 }));

    renderWithProviders(<IncomeEntryForm isPending={false} onSubmit={noop} onCancel={noop} />);

    // The form skeleton must be present despite the failed events request — no white screen.
    expect(await screen.findByText('Data de Depósito')).toBeInTheDocument();
    expect(screen.getByText('Valor (R$)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
  });

  it('renders the form when the events lookup succeeds', async () => {
    server.use(...handlers());

    renderWithProviders(<IncomeEntryForm isPending={false} onSubmit={noop} onCancel={noop} />);

    expect(await screen.findByText('Data de Depósito')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
  });
});

describe('IncomeEntryForm submit validation (interaction)', () => {
  it('blocks submit and surfaces the required-field errors when the form is empty', async () => {
    server.use(...handlers());
    const onSubmit = vi.fn();

    renderWithProviders(<IncomeEntryForm isPending={false} onSubmit={onSubmit} onCancel={noop} />);
    await screen.findByText('Data de Depósito');

    // Drive the actual submit button — react-hook-form runs the zod resolver and renders errors.
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    expect(await screen.findByText('Data de depósito é obrigatória.')).toBeInTheDocument();
    expect(screen.getByText('Valor é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('Categoria é obrigatória.')).toBeInTheDocument();
    expect(screen.getByText('Forma de pagamento é obrigatória.')).toBeInTheDocument();
    // The guard held: the parent's onSubmit must NOT fire while the form is invalid.
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears the amount error once a valid value is typed and re-submitted', async () => {
    server.use(...handlers());
    const onSubmit = vi.fn();

    renderWithProviders(<IncomeEntryForm isPending={false} onSubmit={onSubmit} onCancel={noop} />);
    await screen.findByText('Data de Depósito');

    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));
    expect(await screen.findByText('Valor é obrigatório.')).toBeInTheDocument();

    // Typing a valid decimal into the MoneyInput should clear its required-field error on resubmit.
    await userEvent.type(document.querySelector('#amount') as HTMLInputElement, '100.00');
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await vi.waitFor(() =>
      expect(screen.queryByText('Valor é obrigatório.')).not.toBeInTheDocument()
    );
    // Still blocked overall (category/payment-method are Selects we can't drive in jsdom).
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
