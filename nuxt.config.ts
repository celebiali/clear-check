// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@vite-pwa/nuxt'
  ],
  ui: {
    global: true,
  },
  vite: {
    server: {
      hmr: {
        protocol: 'ws',
        host: 'localhost'
      }
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'ClearCheck Boycott Scanner',
      short_name: 'ClearCheck',
      theme_color: '#ffffff',
      icons: [
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,json}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/tessdata\.cepstral\.com\/.*$/i, // Tesseract models
          handler: 'CacheFirst',
          options: {
            cacheName: 'tesseract-models',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    },
    devOptions: {
      enabled: false,
      type: 'module'
    }
  },
  experimental: {
    appManifest: false,
    payloadExtraction: false
  },
  routeRules: {
    '/**': { ssr: false }
  },
  compatibilityDate: '2024-04-30',
  devtools: { enabled: true }
})
