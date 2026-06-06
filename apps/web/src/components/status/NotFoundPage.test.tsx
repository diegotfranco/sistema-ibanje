import { describe, it, expect } from 'vitest';
import { NotFoundPage } from './NotFoundPage';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('NotFoundPage', () => {
  it('renders the not found page', () => {
    const { container } = renderWithProviders(<NotFoundPage />);

    expect(container).toBeInTheDocument();
  });

  it('displays page content', () => {
    const { container } = renderWithProviders(<NotFoundPage />);

    // Should render some content on the page
    expect(container.textContent).toBeTruthy();
  });

  it('is a valid page component', () => {
    const { container } = renderWithProviders(<NotFoundPage />);

    expect(container.firstChild).toBeTruthy();
  });

  it('renders without errors', () => {
    const { container } = renderWithProviders(<NotFoundPage />);

    expect(container).toBeTruthy();
  });
});
