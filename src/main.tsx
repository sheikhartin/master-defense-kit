/**
 * نقطه ورود برنامه.
 * قلم فارسی Vazirmatn از بسته محلی @fontsource بارگذاری می‌شود؛
 * هیچ فونتی از اینترنت دریافت نمی‌شود.
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
if (!rootEl) throw new Error('عنصر ریشه پیدا نشد');

/* در نسخه تولیدی، سرویس‌کارگر برای کار کاملاً آفلاین ثبت می‌شود */
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
