import type { ReactElement, ReactNode } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import { ThemeProvider } from '@/components/ThemeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';

type RenderWithProvidersResult = RenderResult & { queryClient: QueryClient };

// Mounts a component inside the providers every page depends on: TanStack Query (retry disabled so
// failed requests surface immediately in tests), React Router (MemoryRouter for an isolated history),
// and ThemeProvider (AuthLayout and others read useTheme). Returns the testing-library result plus
// the QueryClient for assertions on cache state. The explicit return type avoids a portability error
// from the inferred RenderResult referencing pretty-format internals.
//
// `route` sets the initial history entry. `path` is for pages that read route params (useParams):
// pass e.g. path='/closings/:id' + route='/closings/1' and the ui is mounted as that route's element.
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', path }: { route?: string; path?: string } = {}
): RenderWithProvidersResult {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <MemoryRouter initialEntries={[route]}>
              {path ? (
                <Routes>
                  <Route path={path} element={children} />
                </Routes>
              ) : (
                children
              )}
            </MemoryRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return Object.assign(render(ui, { wrapper: Wrapper }), { queryClient });
}
