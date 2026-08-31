import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// الريبو ده صفحة مشروع على GitHub Pages (username.github.io/elhazem/)، فكل حاجة لازم تتبنى
// تحت /elhazem/ — الموقع على الجذر بتاعها، وداشبورد التحليل متداخل تحت /elhazem/analytics/
// (راجع .github/workflows/deploy-pages.yml وapps/analytics/vite.config.ts).
export default defineConfig({
  base: '/elhazem/',
  plugins: [react(), tailwindcss()],
})
