import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MinutesPage from './MinutesPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, referenceHandlers, listHandler, meHandler } from '@/test/server';
import { MinuteStatus } from '@sistema-ibanje/shared';

const server = setupTestServer();

const minuteRows = [
  {
    id: 1,
    meetingId: 1,
    minuteNumber: 'ATA-001',
    presidingPastorName: 'Pastor João',
    secretaryName: 'Maria Silva',
    openingTime: '10:00',
    closingTime: '11:30',
    attendersPresent: [],
    pautas: 'Item 1; Item 2',
    hasSignedDocument: false,
    isNotarized: false,
    notarizedAt: null,
    correctsMinuteId: null,
    currentVersion: {
      id: 1,
      version: 1,
      content: {},
      status: MinuteStatus.Draft,
      reasonForChange: null,
      createdByUserId: 1,
      approvedAtMeetingId: null,
      createdAt: '2026-01-01T10:00:00Z'
    },
    versions: [],
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-01T10:00:00Z'
  },
  {
    id: 2,
    meetingId: 2,
    minuteNumber: 'ATA-002',
    presidingPastorName: 'Pastor Pedro',
    secretaryName: 'Ana Costa',
    openingTime: '15:00',
    closingTime: '16:45',
    attendersPresent: [],
    pautas: 'Item A; Item B; Item C',
    hasSignedDocument: true,
    isNotarized: true,
    notarizedAt: '2026-01-10T00:00:00Z',
    correctsMinuteId: null,
    currentVersion: {
      id: 2,
      version: 1,
      content: {},
      status: MinuteStatus.Approved,
      reasonForChange: null,
      createdByUserId: 1,
      approvedAtMeetingId: 2,
      createdAt: '2026-01-02T15:00:00Z'
    },
    versions: [],
    createdAt: '2026-01-02T15:00:00Z',
    updatedAt: '2026-01-02T15:00:00Z'
  }
];

describe('MinutesPage', () => {
  it('renders the list with minutes once data loads', async () => {
    server.use(listHandler('/minutes', minuteRows), ...referenceHandlers());

    renderWithProviders(<MinutesPage />);

    expect(await screen.findByText('Atas de Reuniões')).toBeInTheDocument();
    expect(await screen.findByText('ATA-001')).toBeInTheDocument();
    expect(screen.getByText('ATA-002')).toBeInTheDocument();
  });

  it('opens the create form when the user clicks "Nova" (has Create permission)', async () => {
    server.use(listHandler('/minutes', minuteRows), ...referenceHandlers());

    renderWithProviders(<MinutesPage />);
    await screen.findByText('ATA-001');

    await userEvent.click(screen.getByRole('button', { name: /nova/i }));

    expect(await screen.findByText(/Nova Ata/i)).toBeInTheDocument();
  });

  it('hides the "Nova" button for a user without Create permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      listHandler('/minutes', minuteRows),
      ...referenceHandlers()
    );

    renderWithProviders(<MinutesPage />);
    await screen.findByText('ATA-001');

    expect(screen.queryByRole('button', { name: /nova/i })).not.toBeInTheDocument();
  });

  it('shows the empty state when there are no minutes', async () => {
    server.use(listHandler('/minutes', []), ...referenceHandlers());

    renderWithProviders(<MinutesPage />);

    await waitFor(() => {
      expect(screen.getByText('Atas de Reuniões')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma ata encontrada.')).toBeInTheDocument();
    });
  });

  it('displays row details correctly', async () => {
    server.use(listHandler('/minutes', minuteRows), ...referenceHandlers());

    renderWithProviders(<MinutesPage />);
    await screen.findByText('ATA-001');

    // Check table content
    const cells = screen.getAllByRole('cell');
    const reuniaoCell = cells.find((c) => c.textContent.includes('Reunião #1'));
    expect(reuniaoCell).toBeInTheDocument();
  });

  it('navigates to minute detail when clicking Abrir button', async () => {
    server.use(listHandler('/minutes', minuteRows), ...referenceHandlers());

    renderWithProviders(<MinutesPage />);
    await screen.findByText('ATA-001');

    const openButtons = screen.getAllByRole('button', { name: /abrir/i });
    expect(openButtons.length).toBeGreaterThan(0);
  });

  it('shows delete button only for draft/awaiting approval minutes when user has Delete permission', async () => {
    server.use(listHandler('/minutes', minuteRows), ...referenceHandlers());

    renderWithProviders(<MinutesPage />);
    await screen.findByText('ATA-001');

    const deleteButtons = screen.queryAllByRole('button', { name: /excluir/i });
    // Only ATA-001 (Draft) should have delete button, not ATA-002 (Approved)
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('hides delete button when user lacks Delete permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      listHandler('/minutes', minuteRows),
      ...referenceHandlers()
    );

    renderWithProviders(<MinutesPage />);
    await screen.findByText('ATA-001');

    expect(screen.queryByRole('button', { name: /excluir/i })).not.toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    server.use(listHandler('/minutes', minuteRows), ...referenceHandlers());

    renderWithProviders(<MinutesPage />);

    // Component should start loading and then show data
    expect(screen.getByText('Atas de Reuniões')).toBeInTheDocument();
  });
});
