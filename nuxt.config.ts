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
    optimizeDeps: {
      include: ['@zxing/library']
    },
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
          urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'external-resources',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/tessdata\.projectnaptha\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'tesseract-data',
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
