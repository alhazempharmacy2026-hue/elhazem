import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Medicines from './pages/Medicines'
import Sales from './pages/Sales'
import { PharmacyContext, usePharmacyStore } from './lib/storage'

export default function App() {
  const store = usePharmacyStore()

  return (
    <PharmacyContext.Provider value={store}>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="medicines" element={<Medicines />} />
            <Route path="sales" element={<Sales />} />
          </Route>
        </Routes>
      </HashRouter>
    </PharmacyContext.Provider>
  )
}
