import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// ملاحظة: على عكس apps/analytics، الأداة دي مش هتتنشر على GitHub Pages (لوحة تحكم
// داخلية للموظفين بس)، فمفيش داعي لـ `base` مخصص — بتتنشر من الجذر `/`.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
