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

const matomoUrl = import.meta.env.VITE_MATOMO_URL;
const matomoSiteId = import.meta.env.VITE_MATOMO_SITE_ID;

if (matomoUrl && matomoSiteId) {
  const _paq = (window._paq = window._paq || []);
  _paq.push(['enableLinkTracking']);
  _paq.push(['setTrackerUrl', `${matomoUrl}matomo.php`]);
  _paq.push(['setSiteId', matomoSiteId]);
  const script = document.createElement('script');
  script.async = true;
  script.src = `${matomoUrl}matomo.js`;
  document.head.appendChild(script);

  router.subscribe('onResolved', () => {
    window._paq?.push(['setCustomUrl', window.location.href]);
    window._paq?.push(['trackPageView']);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
