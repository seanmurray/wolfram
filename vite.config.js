import { execSync } from 'node:child_process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
//
// `base` is read from VITE_BASE_PATH so a GitHub Pages deployment under a
// project subpath works without code changes. Local dev defaults to "/".

// Short git sha stamped into <meta name="build"> so scripts/check-live.mjs can
// prove which build is actually being served. CI provides GITHUB_SHA.
function buildId() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try { return execSync('git rev-parse --short HEAD').toString().trim() } catch { return 'dev' }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH || '/'
  const build = buildId()

  return {
  base,
  plugins: [
    react(),
    {
      name: 'build-meta',
      transformIndexHtml: (html) =>
        html.replace('</head>', `    <meta name="build" content="${build}" />\n  </head>`),
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Wolfram — Strength for the Long Run',
        short_name: 'Wolfram',
        description: 'Heavy lifting, impact work, and the classes you love, balanced into one week.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#f5efe6',
        theme_color: '#f5efe6',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache-first for the app shell.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              // Prefixed: every github.io project page shares one origin, and
              // with it one Cache Storage namespace.
              cacheName: 'wolfram-google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
  },
  }
})
