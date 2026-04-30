import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { router } from './lib/router';
import './index.css';

declare global {
  interface Window { _paq?: Array<unknown[]>; }
}

router.subscribe('onResolved', () => {
  window._paq?.push(['setCustomUrl', window.location.href]);
  window._paq?.push(['trackPageView']);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
