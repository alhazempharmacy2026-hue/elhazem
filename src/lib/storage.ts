import { createContext, useContext, useEffect, useState } from 'react'
import type { AppData, DailyRecord } from '../types'
import { seedDailyRecords } from '../data/seed'

const STORAGE_KEY = 'elhazem-pharmacy-data-v2'

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AppData
  } catch {
    // ignore corrupt storage, fall back to seed
  }
  const seeded = { records: seedDailyRecords() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
  return seeded
}

function saveData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export interface AppStore {
  data: AppData
  addRecord: (r: DailyRecord) => void
  updateRecord: (r: DailyRecord) => void
  deleteRecord: (id: string) => void
  importRecords: (records: DailyRecord[]) => { added: number; updated: number }
  resetDemoData: () => void
  clearAllData: () => void
}

export function useAppStore(): AppStore {
  const [data, setData] = useState<AppData>(() => loadData())

  useEffect(() => {
    saveData(data)
  }, [data])

  const addRecord = (r: DailyRecord) => setData((prev) => ({ records: [...prev.records, r] }))

  const updateRecord = (r: DailyRecord) =>
    setData((prev) => ({ records: prev.records.map((x) => (x.id === r.id ? r : x)) }))

  const deleteRecord = (id: string) => setData((prev) => ({ records: prev.records.filter((x) => x.id !== id) }))

  const importRecords = (incoming: DailyRecord[]) => {
    const byDate = new Map(data.records.map((r) => [r.date, r]))
    let added = 0
    let updated = 0
    for (const rec of incoming) {
      const existing = byDate.get(rec.date)
      if (existing) {
        updated++
        byDate.set(rec.date, { ...existing, ...rec, id: existing.id })
      } else {
        added++
        byDate.set(rec.date, rec)
      }
    }
    const records = Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? -1 : 1))
    setData({ records })
    return { added, updated }
  }

  const resetDemoData = () => setData({ records: seedDailyRecords() })
  const clearAllData = () => setData({ records: [] })

  return { data, addRecord, updateRecord, deleteRecord, importRecords, resetDemoData, clearAllData }
}

export const AppContext = createContext<AppStore | null>(null)

export function useAppData(): AppStore {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppData must be used within AppContext.Provider')
  return ctx
}
