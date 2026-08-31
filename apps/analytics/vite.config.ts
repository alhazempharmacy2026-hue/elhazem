import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// داشبورد التحليل الداخلي بقى متداخل تحت موقع العملاء الجديد (apps/web) بدل ما يكون على الجذر —
// راجع .github/workflows/deploy-pages.yml.
export default defineConfig({
  base: '/elhazem/analytics/',
  plugins: [react(), tailwindcss()],
})
