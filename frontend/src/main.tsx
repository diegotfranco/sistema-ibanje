import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router/dom';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/routes/Router';
import { Toaster } from 'sonner';
import { AuthInitializer } from '@/components/AuthInitializer';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>
        <RouterProvider router={router} />
      </AuthInitializer>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  </StrictMode>
);
