import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),

    VitePWA({
      // Auto-update SW in background to immediately evict old chunks
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      // El SW solo se inyecta en producción (build); en dev Vite sirve directamente.
      devOptions: {
        enabled: false
      },

      manifest: {
        name: 'PRIME OS',
        short_name: 'PRIME',
        description: 'Dashboard de rendimiento personal: horarios, gym, Outlier, finanzas e hidratación.',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#0f1729',
        background_color: '#090d16',
        lang: 'es',
        categories: ['productivity', 'health', 'finance'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Inicio',
            url: '/',
            description: 'Ver el dashboard principal'
          }
        ]
      },

      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Estrategia: stale-while-revalidate para el shell de la app.
        // Sirve desde caché inmediatamente y actualiza en background.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        // NUNCA cachear llamadas a la API del gateway.
        // Todas las rutas /api/* se manejan en red puro (network-only).
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//],

        runtimeCaching: [
          {
            // API del gateway → siempre red, sin caché
            urlPattern: /^https?:\/\/[^/]+\/api\//,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'prime-api-no-cache'
            }
          },
          {
            // Fuentes de Google (si las hubiera) → stale-while-revalidate
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'prime-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          }
        ]
      }
    })
  ],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/framer-motion/') ||
              id.includes('node_modules/motion/')) {
            return 'vendor-framer';
          }
          if (id.includes('node_modules/swiper/')) {
            return 'vendor-swiper';
          }
          if (id.includes('node_modules/canvas-confetti/')) {
            return 'vendor-confetti';
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-lucide';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600
  }
})
