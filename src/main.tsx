/**
 * Application entry point.
 * The Persian Vazirmatn font is loaded from the local @fontsource package;
 * no font is ever fetched from the internet.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/700.css';
import '@fontsource/vazirmatn/800.css';
import './index.css';
import App from './App';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

/* In the production build the service worker is registered for full offline use */
if (import.meta.env.PROD) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
