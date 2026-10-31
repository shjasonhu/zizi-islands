import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/zizi-islands/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: '字字群島 Zizi Islands',
        short_name: '字字群島',
        description: 'A bilingual Chinese-learning island game. 中英對照的中文學習島。',
        start_url: '/zizi-islands/',
        scope: '/zizi-islands/',
        display: 'standalone',
        background_color: '#3FA7B5',
        theme_color: '#1C1C1C',
        lang: 'zh-Hant',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,webmanifest,woff2,enc}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/content\.enc$/],
      },
    }),
  ],
})
