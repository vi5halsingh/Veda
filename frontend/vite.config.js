import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),
  VitePWA({
    manifest: {
      name: "veda",
      short_name: 'AI Assistant',
      description: 'veda is AI assistant by @dino4dev',
      theme_color: '#000000',
      background_color: '#ffffff',
      icons: [
        {
          "src": "/logo.svg",
          "sizes": "any",
          "type": "image/svg+xml"
        }
      ],
      start_url: '.',
      display: 'standalone',
     
    },
    registerType: 'prompt'
  })
  ],
})
