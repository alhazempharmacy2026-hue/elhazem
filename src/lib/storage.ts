import { createContext, useContext, useEffect, useState } from 'react'
import type { AppData, DailyRecord, EmergencyPurchase, Item, Supplier, SupplierTransaction } from '../types'
import { seedDailyRecords } from '../data/seed'
import type { ParsedItemRow } from './importItems'
import type { ParsedSalesRow } from './importSales'

const STORAGE_KEY = 'elhazem-pharmacy-data-v2'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppData>
      return {
        records: parsed.records ?? [],
        items: parsed.items ?? [],
        suppliers: parsed.suppliers ?? [],
        supplierTransactions: parsed.supplierTransactions ?? [],
        emergencyPurchases: parsed.emergencyPurchases ?? [],
      }
    }
  } catch {
    // ignore corrupt storage, fall back to seed
  }
  const seeded: AppData = { records: seedDailyRecords(), items: [], suppliers: [], supplierTransactions: [], emergencyPurchases: [] }
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

  addItem: (item: Omit<Item, 'id' | 'updatedAt'>) => void
  updateItem: (item: Item) => void
  deleteItem: (id: string) => void
  importItems: (rows: ParsedItemRow[]) => { added: number; updated: number; newSuppliers: number }
  importItemSales: (rows: ParsedSalesRow[], periodDays: number) => { matched: number; created: number }

  addSupplier: (s: Omit<Supplier, 'id'>) => void
  updateSupplier: (s: Supplier) => void
  deleteSupplier: (id: string) => void

  addSupplierTransaction: (t: Omit<SupplierTransaction, 'id'>) => void
  deleteSupplierTransaction: (id: string) => void

  addEmergencyPurchase: (p: Omit<EmergencyPurchase, 'id'>) => void
  updateEmergencyPurchase: (p: EmergencyPurchase) => void
  deleteEmergencyPurchase: (id: string) => void
}

export function useAppStore(): AppStore {
  const [data, setData] = useState<AppData>(() => loadData())

  useEffect(() => {
    saveData(data)
  }, [data])

  const addRecord = (r: DailyRecord) => setData((prev) => ({ ...prev, records: [...prev.records, r] }))

  const updateRecord = (r: DailyRecord) =>
    setData((prev) => ({ ...prev, records: prev.records.map((x) => (x.id === r.id ? r : x)) }))

  const deleteRecord = (id: string) => setData((prev) => ({ ...prev, records: prev.records.filter((x) => x.id !== id) }))

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
    setData((prev) => ({ ...prev, records }))
    return { added, updated }
  }

  const resetDemoData = () => setData((prev) => ({ ...prev, records: seedDailyRecords() }))
  const clearAllData = () => setData((prev) => ({ ...prev, records: [] }))

  const addItem = (item: Omit<Item, 'id' | 'updatedAt'>) =>
    setData((prev) => ({ ...prev, items: [...prev.items, { ...item, id: uid('item'), updatedAt: today() }] }))

  const updateItem = (item: Item) =>
    setData((prev) => ({ ...prev, items: prev.items.map((x) => (x.id === item.id ? { ...item, updatedAt: today() } : x)) }))

  const deleteItem = (id: string) => setData((prev) => ({ ...prev, items: prev.items.filter((x) => x.id !== id) }))

  const importItems = (rows: ParsedItemRow[]) => {
    let added = 0
    let updated = 0
    let newSuppliers = 0
    setData((prev) => {
      const suppliers = [...prev.suppliers]
      const supplierByName = new Map(suppliers.map((s) => [s.name.trim().toLowerCase(), s]))
      const items = [...prev.items]
      const byCode = new Map<string, Item>()
      const byName = new Map<string, Item>()
      for (const it of items) {
        if (it.code) byCode.set(it.code.trim().toLowerCase(), it)
        byName.set(it.name.trim().toLowerCase(), it)
      }

      for (const row of rows) {
        let supplierId: string | undefined
        if (row.supplierName?.trim()) {
          const key = row.supplierName.trim().toLowerCase()
          let sup = supplierByName.get(key)
          if (!sup) {
            sup = { id: uid('sup'), name: row.supplierName.trim() }
            suppliers.push(sup)
            supplierByName.set(key, sup)
            newSuppliers++
          }
          supplierId = sup.id
        }

        const codeKey = row.code?.trim() ? row.code.trim().toLowerCase() : undefined
        const nameKey = row.name.trim().toLowerCase()
        const existing = (codeKey && byCode.get(codeKey)) || byName.get(nameKey)

        if (existing) {
          updated++
          existing.name = row.name.trim() || existing.name
          if (row.code?.trim()) existing.code = row.code.trim()
          if (row.unit?.trim()) existing.unit = row.unit.trim()
          if (row.category?.trim()) existing.category = row.category.trim()
          if (row.currentStock !== undefined) existing.currentStock = row.currentStock
          if (row.minStock !== undefined) existing.minStock = row.minStock
          if (row.purchasePrice !== undefined) existing.purchasePrice = row.purchasePrice
          if (row.salePrice !== undefined) existing.salePrice = row.salePrice
          if (supplierId) existing.supplierId = supplierId
          existing.updatedAt = today()
        } else {
          added++
          const newItem: Item = {
            id: uid('item'),
            name: row.name.trim(),
            code: row.code?.trim() || undefined,
            unit: row.unit?.trim() || undefined,
            category: row.category?.trim() || undefined,
            currentStock: row.currentStock ?? 0,
            minStock: row.minStock ?? 0,
            purchasePrice: row.purchasePrice,
            salePrice: row.salePrice,
            supplierId,
            updatedAt: today(),
          }
          items.push(newItem)
          byName.set(nameKey, newItem)
          if (codeKey) byCode.set(codeKey, newItem)
        }
      }

      return { ...prev, items, suppliers }
    })
    return { added, updated, newSuppliers }
  }

  const importItemSales = (rows: ParsedSalesRow[], periodDays: number) => {
    let matched = 0
    let created = 0
    setData((prev) => {
      const items = [...prev.items]
      const byCode = new Map<string, Item>()
      const byName = new Map<string, Item>()
      for (const it of items) {
        if (it.code) byCode.set(it.code.trim().toLowerCase(), it)
        byName.set(it.name.trim().toLowerCase(), it)
      }

      for (const row of rows) {
        const avgDailySales = periodDays > 0 ? row.quantitySold / periodDays : row.quantitySold
        const codeKey = row.code?.trim() ? row.code.trim().toLowerCase() : undefined
        const nameKey = row.name.trim().toLowerCase()
        const existing = (codeKey && byCode.get(codeKey)) || byName.get(nameKey)

        if (existing) {
          matched++
          existing.avgDailySales = avgDailySales
          existing.salesPeriodDays = periodDays
          existing.updatedAt = today()
        } else {
          created++
          const newItem: Item = {
            id: uid('item'),
            name: row.name.trim(),
            code: row.code?.trim() || undefined,
            currentStock: 0,
            minStock: 0,
            avgDailySales,
            salesPeriodDays: periodDays,
            updatedAt: today(),
          }
          items.push(newItem)
          byName.set(nameKey, newItem)
          if (codeKey) byCode.set(codeKey, newItem)
        }
      }

      return { ...prev, items }
    })
    return { matched, created }
  }

  const addSupplier = (s: Omit<Supplier, 'id'>) => setData((prev) => ({ ...prev, suppliers: [...prev.suppliers, { ...s, id: uid('sup') }] }))

  const updateSupplier = (s: Supplier) =>
    setData((prev) => ({ ...prev, suppliers: prev.suppliers.map((x) => (x.id === s.id ? s : x)) }))

  const deleteSupplier = (id: string) =>
    setData((prev) => ({
      ...prev,
      suppliers: prev.suppliers.filter((x) => x.id !== id),
      supplierTransactions: prev.supplierTransactions.filter((x) => x.supplierId !== id),
      items: prev.items.map((it) => (it.supplierId === id ? { ...it, supplierId: undefined } : it)),
    }))

  const addSupplierTransaction = (t: Omit<SupplierTransaction, 'id'>) =>
    setData((prev) => ({ ...prev, supplierTransactions: [...prev.supplierTransactions, { ...t, id: uid('txn') }] }))

  const deleteSupplierTransaction = (id: string) =>
    setData((prev) => ({ ...prev, supplierTransactions: prev.supplierTransactions.filter((x) => x.id !== id) }))

  const addEmergencyPurchase = (p: Omit<EmergencyPurchase, 'id'>) =>
    setData((prev) => ({ ...prev, emergencyPurchases: [...prev.emergencyPurchases, { ...p, id: uid('emg') }] }))

  const updateEmergencyPurchase = (p: EmergencyPurchase) =>
    setData((prev) => ({ ...prev, emergencyPurchases: prev.emergencyPurchases.map((x) => (x.id === p.id ? p : x)) }))

  const deleteEmergencyPurchase = (id: string) =>
    setData((prev) => ({ ...prev, emergencyPurchases: prev.emergencyPurchases.filter((x) => x.id !== id) }))

  return {
    data,
    addRecord,
    updateRecord,
    deleteRecord,
    importRecords,
    resetDemoData,
    clearAllData,
    addItem,
    updateItem,
    deleteItem,
    importItems,
    importItemSales,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    addSupplierTransaction,
    deleteSupplierTransaction,
    addEmergencyPurchase,
    updateEmergencyPurchase,
    deleteEmergencyPurchase,
  }
}

export const AppContext = createContext<AppStore | null>(null)

export function useAppData(): AppStore {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppData must be used within AppContext.Provider')
  return ctx
}
