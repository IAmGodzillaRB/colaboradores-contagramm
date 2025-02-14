import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa';
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
  VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Aplicación PWA Contagramm',
      short_name: 'Contagramm',
      description: 'Una aplicación PWA increíble',
      icons: [
        {
          src: 'favicon192.png',
          sizes: '192x192',
          type: 'icon/png',
        },
        {
          src: 'favicon512.png',
          sizes: '512x512',
          type: 'icon/png',
        },

      ],
      start_url: "/usuarios/login",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#000000"
    },
  }),
  ],
})
