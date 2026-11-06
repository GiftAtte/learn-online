// Literata (headings) was designed for reading on screens; Source Sans 3 (text and controls) is a calm,
// legible humanist sans. Together they give the look of a well-made textbook. `opsz` lets big headings
// use Literata's display design.
import '@fontsource-variable/literata/opsz.css';
import '@fontsource-variable/source-sans-3';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppProviders } from '@/pages/app-providers';
import { reloadOnce } from '@/core/lib/stale-page';
import { router } from '@/router/router';
import '@/styles/globals.css';

// Vite tells us when a file of an older version could not be loaded; load the new version instead.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  reloadOnce();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
