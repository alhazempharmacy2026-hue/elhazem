import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DailyData from './pages/DailyData'
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
          </Route>
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  )
}
