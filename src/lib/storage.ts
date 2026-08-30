import { createContext, useContext, useEffect, useState } from 'react'
import type { PharmacyData, Medicine, Sale } from '../types'
import { seedPharmacyData } from '../data/seed'

const STORAGE_KEY = 'elhazem-pharmacy-data-v1'

function loadData(): PharmacyData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PharmacyData
  } catch {
    // ignore corrupt storage, fall back to seed
  }
  const seeded = seedPharmacyData()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
  return seeded
}

function saveData(data: PharmacyData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export interface PharmacyStore {
  data: PharmacyData
  addMedicine: (m: Medicine) => void
  updateMedicine: (m: Medicine) => void
  deleteMedicine: (id: string) => void
  addSale: (s: Sale) => void
  resetDemoData: () => void
}

export function usePharmacyStore(): PharmacyStore {
  const [data, setData] = useState<PharmacyData>(() => loadData())

  useEffect(() => {
    saveData(data)
  }, [data])

  const addMedicine = (m: Medicine) => setData((prev) => ({ ...prev, medicines: [...prev.medicines, m] }))

  const updateMedicine = (m: Medicine) =>
    setData((prev) => ({ ...prev, medicines: prev.medicines.map((x) => (x.id === m.id ? m : x)) }))

  const deleteMedicine = (id: string) =>
    setData((prev) => ({ ...prev, medicines: prev.medicines.filter((x) => x.id !== id) }))

  const addSale = (s: Sale) =>
    setData((prev) => {
      const medicines = prev.medicines.map((med) => {
        const item = s.items.find((it) => it.medicineId === med.id)
        if (!item) return med
        return { ...med, stock: Math.max(0, med.stock - item.qty) }
      })
      return { medicines, sales: [...prev.sales, s] }
    })

  const resetDemoData = () => setData(seedPharmacyData())

  return { data, addMedicine, updateMedicine, deleteMedicine, addSale, resetDemoData }
}

export const PharmacyContext = createContext<PharmacyStore | null>(null)

export function usePharmacy(): PharmacyStore {
  const ctx = useContext(PharmacyContext)
  if (!ctx) throw new Error('usePharmacy must be used within PharmacyContext.Provider')
  return ctx
}
