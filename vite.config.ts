import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Build configuration: fully offline.
 * There is no CDN and no external service; only local assets (font, equations, images).
 */
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'icon.svg',
          'favicon.ico',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512.png',
        ],
        manifest: {
          name: 'بستار دفاع ارشد BCOA',
          short_name: 'بستار دفاع ارشد BCOA',
          description:
            'تمرین گام‌به‌گام و کاملاً آفلاین جلسه دفاع پایان‌نامه کارشناسی ارشد (الگوریتم BCOA)',
          lang: 'fa',
          dir: 'rtl',
          display: 'standalone',
          orientation: 'portrait',
          /* Kept in sync with theme-color in index.html so the browser bar and header match */
          theme_color: '#fcfaf3',
          background_color: '#f4f0e6',
          icons: [
            { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,woff2,woff,ttf,svg,png,ico}'],
          navigateFallback: '/index.html',
          maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        },
      }),
    ],
    server: {
      host: '0.0.0.0',
      port: 3000,
      // Accept e2b.app preview hosts (development only; no external request is ever made)
      allowedHosts: ['.e2b.app'],
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: ['.e2b.app'],
    },
    build: {
      target: 'es2020',
      cssCodeSplit: false,
      chunkSizeWarningLimit: 1200,
    },
  };
});
