import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DailyData from './pages/DailyData'
import Inventory from './pages/Inventory'
import Suppliers from './pages/Suppliers'
import EmergencyPurchases from './pages/EmergencyPurchases'
import MounjaroTracking from './pages/MounjaroTracking'
import { AppContext, useAppStore } from './lib/storage'

export default function App() {
  const store = useAppStore()

  return (
    <AppContext.Provider value={store}>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="data" element={<DailyData />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="emergency-purchases" element={<EmergencyPurchases />} />
            <Route path="mounjaro" element={<MounjaroTracking />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  )
}
