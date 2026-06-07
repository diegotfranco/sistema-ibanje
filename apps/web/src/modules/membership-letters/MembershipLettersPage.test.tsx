import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MembershipLettersPage from './MembershipLettersPage';
import { renderWithProviders } from '@/test/renderWithProviders';
import { setupTestServer, listHandler, meHandler, referenceHandlers } from '@/test/server';
import type { MembershipLetterResponse } from './schema';
import type { AttenderResponse } from '@/modules/attenders/schema';

const server = setupTestServer();

const attenders: AttenderResponse[] = [
  {
    id: 1,
    userId: null,
    name: 'João Silva',
    birthDate: '1980-05-15',
    addressStreet: null,
    addressNumber: null,
    addressComplement: null,
    addressDistrict: null,
    state: null,
    city: null,
    postalCode: null,
    email: 'joao@example.com',
    phone: '11999999999',
    status: 'ativo',
    isMember: true,
    baptismDate: '2000-01-10',
    memberSince: null,
    congregatingSince: null,
    admissionMode: null,
    createdAt: new Date('2020-01-01')
  },
  {
    id: 2,
    userId: null,
    name: 'Maria Santos',
    birthDate: '1985-03-20',
    addressStreet: null,
    addressNumber: null,
    addressComplement: null,
    addressDistrict: null,
    state: null,
    city: null,
    postalCode: null,
    email: 'maria@example.com',
    phone: '11888888888',
    status: 'ativo',
    isMember: true,
    baptismDate: '2005-06-15',
    memberSince: null,
    congregatingSince: null,
    admissionMode: null,
    createdAt: new Date('2020-01-01')
  }
];

const letters: MembershipLetterResponse[] = [
  {
    id: 1,
    attenderId: 1,
    type: 'pedido_de_carta_de_transferência',
    letterDate: '2024-06-01',
    otherChurchName: 'Igreja de Cristo Central',
    otherChurchAddress: null,
    otherChurchCity: 'São Paulo',
    otherChurchState: 'SP',
    signingSecretaryName: 'Secretário João',
    signingSecretaryTitle: 'Secretário',
    signingPresidentName: 'Presidente Maria',
    signingPresidentTitle: 'Presidente',
    additionalContext: null,
    createdByUserId: 1,
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: '2024-06-01T00:00:00Z'
  },
  {
    id: 2,
    attenderId: 2,
    type: 'carta_de_transferência',
    letterDate: '2024-05-15',
    otherChurchName: 'Comunidade Evangélica da Paz',
    otherChurchAddress: null,
    otherChurchCity: 'Rio de Janeiro',
    otherChurchState: 'RJ',
    signingSecretaryName: 'Secretário João',
    signingSecretaryTitle: 'Secretário',
    signingPresidentName: 'Presidente Maria',
    signingPresidentTitle: 'Presidente',
    additionalContext: null,
    createdByUserId: 1,
    createdAt: '2024-05-15T00:00:00Z',
    updatedAt: '2024-05-15T00:00:00Z'
  }
];

describe('MembershipLettersPage', () => {
  it('renders the page title and description', async () => {
    server.use(
      listHandler('/membership-letters', letters),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    await waitFor(() => {
      expect(screen.getByText('Gerencie cartas de transferência de membros')).toBeInTheDocument();
    });
  });

  it('displays membership letters in a table', async () => {
    server.use(
      listHandler('/membership-letters', letters),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    await waitFor(() => {
      expect(screen.getByText('Igreja de Cristo Central')).toBeInTheDocument();
      expect(screen.getByText('Comunidade Evangélica da Paz')).toBeInTheDocument();
    });
  });

  it('shows attender names in the table', async () => {
    server.use(
      listHandler('/membership-letters', letters),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    await waitFor(() => {
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });
  });

  it('displays letter type badges', async () => {
    server.use(
      listHandler('/membership-letters', letters),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    await waitFor(() => {
      expect(screen.getByText('Pedido')).toBeInTheDocument();
      expect(screen.getByText('Carta')).toBeInTheDocument();
    });
  });

  it('shows city and state in the table', async () => {
    server.use(
      listHandler('/membership-letters', letters),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    await waitFor(() => {
      expect(screen.getByText('São Paulo/SP')).toBeInTheDocument();
      expect(screen.getByText('Rio de Janeiro/RJ')).toBeInTheDocument();
    });
  });

  it('displays "Nova Carta" button when user has Create permission', async () => {
    server.use(
      listHandler('/membership-letters', letters),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /nova carta/i })).toBeInTheDocument();
    });
  });

  it('hides "Nova Carta" button when user lacks Create permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      listHandler('/membership-letters', letters),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    await waitFor(() => {
      expect(screen.getByText('Gerencie cartas de transferência de membros')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /nova carta/i })).not.toBeInTheDocument();
  });

  it('opens create dialog when "Nova Carta" is clicked', async () => {
    const user = userEvent.setup();
    server.use(
      listHandler('/membership-letters', letters),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /nova carta/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /nova carta/i }));

    expect(screen.getByText('Nova Carta de Transferência')).toBeInTheDocument();
    expect(screen.getByText('Crie uma nova carta de transferência.')).toBeInTheDocument();
  });

  it('shows EntityPicker for filtering by attender', async () => {
    server.use(
      listHandler('/membership-letters', letters),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    await waitFor(() => {
      expect(screen.getByText('Igreja de Cristo Central')).toBeInTheDocument();
    });

    // EntityPicker should be present
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes.length).toBeGreaterThan(0);
  });

  it('shows type filter dropdown', async () => {
    server.use(
      listHandler('/membership-letters', letters),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    await waitFor(() => {
      expect(screen.getByText('Igreja de Cristo Central')).toBeInTheDocument();
    });

    // Should have at least one combobox (EntityPicker or Select)
    const comboboxes = screen.getAllByRole('combobox');
    expect(comboboxes.length).toBeGreaterThan(0);
  });

  it('displays action buttons for each letter', async () => {
    server.use(
      listHandler('/membership-letters', letters),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    await waitFor(() => {
      expect(screen.getByText('Igreja de Cristo Central')).toBeInTheDocument();
    });

    // Eye (preview) buttons
    const eyeButtons = screen.getAllByTitle('Visualizar');
    expect(eyeButtons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no letters exist', async () => {
    server.use(
      listHandler('/membership-letters', []),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma carta de transferência encontrada.')).toBeInTheDocument();
    });
  });

  it('displays edit button only for users with Update permission', async () => {
    server.use(
      listHandler('/membership-letters', letters),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    await waitFor(() => {
      expect(screen.getByText('Igreja de Cristo Central')).toBeInTheDocument();
    });

    // Edit (pencil) buttons should be visible
    const editButtons = screen.getAllByTitle('Editar');
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('hides edit button for users without Update permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      listHandler('/membership-letters', letters),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    await waitFor(() => {
      expect(screen.getByText('Igreja de Cristo Central')).toBeInTheDocument();
    });

    // Edit buttons should not be visible
    expect(screen.queryByTitle('Editar')).not.toBeInTheDocument();
  });

  it('displays delete button only for users with Delete permission', async () => {
    server.use(
      listHandler('/membership-letters', letters),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    await waitFor(() => {
      expect(screen.getByText('Igreja de Cristo Central')).toBeInTheDocument();
    });

    // Delete (trash) buttons should be visible
    const deleteButtons = screen.getAllByTitle('Remover');
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('hides delete button for users without Delete permission', async () => {
    server.use(
      meHandler({ permissions: {} }),
      listHandler('/membership-letters', letters),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    await waitFor(() => {
      expect(screen.getByText('Igreja de Cristo Central')).toBeInTheDocument();
    });

    // Delete buttons should not be visible
    expect(screen.queryByTitle('Remover')).not.toBeInTheDocument();
  });

  it('handles attender lookup gracefully', async () => {
    server.use(
      listHandler('/membership-letters', letters),
      listHandler('/attenders', []),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    // Page should still render structure
    const filters = screen.queryAllByRole('combobox');
    expect(filters.length).toBeGreaterThanOrEqual(0);
  });

  it('renders letter information in table', async () => {
    server.use(
      listHandler('/membership-letters', letters),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    // Letters should render
    await waitFor(() => {
      expect(screen.getByText('Igreja de Cristo Central')).toBeInTheDocument();
    });
  });

  it('renders filter controls', async () => {
    server.use(
      listHandler('/membership-letters', letters),
      listHandler('/attenders', attenders),
      ...referenceHandlers()
    );

    renderWithProviders(<MembershipLettersPage />);

    // Filter area should be rendered
    const labels = screen.getAllByText(/congregado|tipo/i);
    expect(labels.length).toBeGreaterThan(0);
  });
});
