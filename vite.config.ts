import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  server: {
    host: true,
    allowedHosts: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'health-check-endpoint',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/health') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Cache-Control', 'no-store');
            res.end(JSON.stringify({ status: 'ok', mode: 'dev', uptime: process.uptime(), timestamp: new Date().toISOString() }));
            return;
          }
          next();
        });
      }
    }
  ],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/dexie') || id.includes('node_modules/dexie-react-hooks')) {
            return 'vendor-dexie';
          }
          if (id.includes('src/components/SovereignStudioV2')) {
            return 'SovereignStudioV2';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/@capacitor')) {
            return 'vendor-capacitor';
          }
          if (id.includes('node_modules/tesseract.js')) {
            return 'vendor-tesseract';
          }
        }
      }
    }
  }
})
