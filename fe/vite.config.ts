import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  build: {
    // Three.js + postprocessing stanno in un chunk a parte (Showroom), caricato
    // solo su home e dettaglio: la soglia di default da 500 kB e' troppo stretta.
    chunkSizeWarningLimit: 1200,
  },
  server: {
    // In sviluppo il browser vede una sola origine: /api lo inoltra Vite al
    // backend sulla 8080, quindi in locale di CORS non ci si accorge nemmeno.
    // In produzione questo proxy non esiste piu': il sito statico e' un altro
    // dominio, ed e' li' che serve VITE_API_URL.
    proxy: {
      '/api': { target: 'http://localhost:8080' },
    },
  },
})
