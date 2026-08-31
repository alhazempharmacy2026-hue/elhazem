import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import SetupNotice from './pages/SetupNotice'
import Home from './pages/Home'
import CategoryPage from './pages/CategoryPage'
import MedicineDetail from './pages/MedicineDetail'
import CartPage from './pages/CartPage'
import Checkout from './pages/Checkout'
import CheckoutComplete from './pages/CheckoutComplete'
import OrdersList from './pages/OrdersList'
import OrderTracking from './pages/OrderTracking'
import Account from './pages/Account'
import Login from './pages/Login'
import Register from './pages/Register'
import { supabase } from './lib/supabaseClient'

export default function App() {
  if (!supabase) {
    return <SetupNotice />
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="category/:slug" element={<CategoryPage />} />
        <Route path="medicine/:id" element={<MedicineDetail />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="checkout/complete"
          element={
            <ProtectedRoute>
              <CheckoutComplete />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <ProtectedRoute>
              <OrdersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders/:id"
          element={
            <ProtectedRoute>
              <OrderTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
