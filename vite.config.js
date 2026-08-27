import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Dev: base = '/' so public files are at /rooftop_facets.geojson
// Prod (GitHub Pages): base = '/Denchai-GIS/' so files at /Denchai-GIS/rooftop_facets.geojson
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Denchai-GIS/' : '/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['maplibre-gl']
  }
}))
