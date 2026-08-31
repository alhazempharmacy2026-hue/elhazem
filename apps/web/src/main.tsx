import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './lib/AuthContext.tsx'
import { CartProvider } from './lib/CartContext.tsx'

// يكمل حيلة الـ 404.html الخاصة بـ GitHub Pages (راجع public/404.html) — بيرجع الرابط الأصلي
// بعد ما اتحول لـ redirect للجذر.
const redirectPath = sessionStorage.getItem('spa-redirect-path')
if (redirectPath) {
  sessionStorage.removeItem('spa-redirect-path')
  window.history.replaceState(null, '', redirectPath)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/elhazem/">
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
