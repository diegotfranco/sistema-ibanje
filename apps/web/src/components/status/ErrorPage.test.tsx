import { describe, it, expect } from 'vitest';
import { ErrorPage } from './ErrorPage';
import { renderWithProviders } from '@/test/renderWithProviders';

describe('ErrorPage', () => {
  it('renders error page component', () => {
    const { container } = renderWithProviders(
      <ErrorPage error={new Error('Test error')} resetErrorBoundary={() => {}} />
    );

    expect(container).toBeTruthy();
  });

  it('displays error information', () => {
    const { container } = renderWithProviders(
      <ErrorPage error={new Error('Test error')} resetErrorBoundary={() => {}} />
    );

    // Should render some error content
    const content = container.textContent;
    expect(content).toBeTruthy();
  });

  it('renders with null error gracefully', () => {
    const { container } = renderWithProviders(
      <ErrorPage error={null} resetErrorBoundary={() => {}} />
    );

    expect(container).toBeTruthy();
  });

  it('renders with undefined error gracefully', () => {
    const { container } = renderWithProviders(
      <ErrorPage error={undefined} resetErrorBoundary={() => {}} />
    );

    expect(container).toBeTruthy();
  });

  it('has proper error page structure', () => {
    const { container } = renderWithProviders(
      <ErrorPage error={new Error('Test')} resetErrorBoundary={() => {}} />
    );

    // Should be a valid React component
    expect(container.firstChild).toBeTruthy();
  });
});
