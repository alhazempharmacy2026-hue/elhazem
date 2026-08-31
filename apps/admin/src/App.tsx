import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { isSupabaseConfigured } from './lib/supabaseClient'
import { AuthProvider } from './lib/auth'
import RequireStaffAuth from './components/RequireStaffAuth'
import Layout from './components/Layout'
import SetupRequired from './pages/SetupRequired'
import Login from './pages/Login'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Catalog from './pages/Catalog'
import Categories from './pages/Categories'
import Couriers from './pages/Couriers'

// HashRouter (زي apps/analytics) عشان الأداة تشتغل من أي استضافة ملفات ثابتة
// من غير ما تحتاج تظبيط rewrites على السيرفر.
export default function App() {
  if (!isSupabaseConfigured) {
    return <SetupRequired />
  }

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireStaffAuth />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/orders" replace />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="categories" element={<Categories />} />
              <Route path="couriers" element={<Couriers />} />
              <Route path="*" element={<Navigate to="/orders" replace />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
