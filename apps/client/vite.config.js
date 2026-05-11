import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Gym Tracker',
        short_name: 'GymTrack',
        description: 'Log and track your PPL workouts',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache all Vite-built assets
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        runtimeCaching: [
          // GET /api/workouts — network first, fall back to cache (offline reads)
          {
            urlPattern: /\/api\/workouts(\?.*)?$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-workouts',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 1, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          // GET /api/workouts/:date — network first
          {
            urlPattern: /\/api\/workouts\/.+/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-workouts-by-date',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 30, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          // GET /api/templates/:day — cache first (template data rarely changes)
          {
            urlPattern: /\/api\/templates\/.+/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'api-templates',
              expiration: { maxEntries: 10, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          recharts: ['recharts'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
