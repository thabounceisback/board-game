import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/board-game/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Audit Analytics: The Board Game',
        short_name: 'Audit Game',
        description: 'Navigate from Engagement Kick-Off to Partner Sign-Off in this audit analytics board game!',
        theme_color: '#0a0e17',
        background_color: '#0a0e17',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/board-game/',
        start_url: '/board-game/',
        icons: [
          {
            src: '/board-game/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/board-game/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/board-game/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      },
    }),
  ],
});
