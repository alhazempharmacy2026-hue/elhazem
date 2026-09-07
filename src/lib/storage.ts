import { createContext, useContext, useEffect, useState } from 'react'
import type { AppData, DailyRecord, EmergencyPurchase, Item, Supplier, SupplierTransaction } from '../types'
import { seedDailyRecords } from '../data/seed'
import type { ParsedItemRow } from './importItems'
import type { ParsedSalesRow } from './importSales'
import * as cloud from './cloudSync'

const STORAGE_KEY = 'elhazem-pharmacy-data-v2'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// المبيعات اليومية (records) لسه متخزنة في المتصفح بس. المخزون والموردين والمشتريات
// الاضطرارية بقوا متخزنين على السحابة (Supabase) عشان يفضلوا نفسهم من أي جهاز.
function loadRecords(): DailyRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppData>
      if (parsed.records) return parsed.records
    }
  } catch {
    // ignore corrupt storage, fall back to seed
  }
  const seeded = seedDailyRecords()
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ records: seeded }))
  return seeded
}

function saveRecords(records: DailyRecord[]) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Partial<AppData>) : {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, records }))
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ records }))
  }
}

export type CloudStatus = 'loading' | 'ready' | 'error'

export interface AppStore {
  data: AppData
  cloudStatus: CloudStatus
  cloudSyncError: string | null
  dismissCloudSyncError: () => void

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
  importItemSales: (rows: ParsedSalesRow[], periodDays: number) => { matched: number; skipped: number }
  setItemOrderStatus: (id: string, status: Item['orderStatus']) => void

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
  const [records, setRecords] = useState<DailyRecord[]>(() => loadRecords())
  const [items, setItems] = useState<Item[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransaction[]>([])
  const [emergencyPurchases, setEmergencyPurchases] = useState<EmergencyPurchase[]>([])
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('loading')
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null)

  useEffect(() => {
    saveRecords(records)
  }, [records])

  useEffect(() => {
    let cancelled = false
    Promise.all([cloud.fetchItems(), cloud.fetchSuppliers(), cloud.fetchSupplierTransactions(), cloud.fetchEmergencyPurchases()])
      .then(([cloudItems, cloudSuppliers, cloudTxns, cloudEmergency]) => {
        if (cancelled) return
        setItems(cloudItems)
        setSuppliers(cloudSuppliers)
        setSupplierTransactions(cloudTxns)
        setEmergencyPurchases(cloudEmergency)
        setCloudStatus('ready')
      })
      .catch((err: Error) => {
        if (cancelled) return
        setCloudSyncError(err.message)
        setCloudStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  function reportSyncError(err: unknown) {
    setCloudSyncError(err instanceof Error ? err.message : String(err))
  }

  const dismissCloudSyncError = () => setCloudSyncError(null)

  const addRecord = (r: DailyRecord) => setRecords((prev) => [...prev, r])

  const updateRecord = (r: DailyRecord) => setRecords((prev) => prev.map((x) => (x.id === r.id ? r : x)))

  const deleteRecord = (id: string) => setRecords((prev) => prev.filter((x) => x.id !== id))

  const importRecords = (incoming: DailyRecord[]) => {
    const byDate = new Map(records.map((r) => [r.date, r]))
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
    const next = Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? -1 : 1))
    setRecords(next)
    return { added, updated }
  }

  const resetDemoData = () => setRecords(seedDailyRecords())
  const clearAllData = () => setRecords([])

  const addItem = (item: Omit<Item, 'id' | 'updatedAt'>) => {
    const newItem: Item = { ...item, id: uid('item'), updatedAt: today() }
    setItems((prev) => [...prev, newItem])
    cloud.upsertItems([newItem]).catch(reportSyncError)
  }

  const updateItem = (item: Item) => {
    const updated: Item = { ...item, updatedAt: today() }
    setItems((prev) => prev.map((x) => (x.id === item.id ? updated : x)))
    cloud.upsertItems([updated]).catch(reportSyncError)
  }

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id))
    cloud.deleteItemRow(id).catch(reportSyncError)
  }

  const importItems = (rows: ParsedItemRow[]) => {
    let added = 0
    let updated = 0
    let newSuppliers = 0
    const touchedItems: Item[] = []
    const touchedSuppliers: Supplier[] = []

    const nextItems = [...items]
    const byCode = new Map<string, Item>()
    const byName = new Map<string, Item>()
    for (const it of nextItems) {
      if (it.code) byCode.set(it.code.trim().toLowerCase(), it)
      byName.set(it.name.trim().toLowerCase(), it)
    }

    const nextSuppliers = [...suppliers]
    const supplierByName = new Map(nextSuppliers.map((s) => [s.name.trim().toLowerCase(), s]))

    for (const row of rows) {
      let supplierId: string | undefined
      if (row.supplierName?.trim()) {
        const key = row.supplierName.trim().toLowerCase()
        let sup = supplierByName.get(key)
        if (!sup) {
          sup = { id: uid('sup'), name: row.supplierName.trim() }
          nextSuppliers.push(sup)
          supplierByName.set(key, sup)
          touchedSuppliers.push(sup)
          newSuppliers++
        }
        supplierId = sup.id
      }

      // A row with a code matches/creates by code only — falling back to a name match
      // would silently merge two distinct products that happen to share the same name
      // text (seen in real pharmacy exports: same name, different pack size/code).
      const codeKey = row.code?.trim() ? row.code.trim().toLowerCase() : undefined
      const nameKey = row.name.trim().toLowerCase()
      const existing = codeKey ? byCode.get(codeKey) : byName.get(nameKey)

      if (existing) {
        updated++
        existing.name = row.name.trim() || existing.name
        if (row.code?.trim()) existing.code = row.code.trim()
        if (row.unit?.trim()) existing.unit = row.unit.trim()
        if (row.category?.trim()) existing.category = row.category.trim()
        // Stock going up means the order arrived (or a manual correction) — the
        // previous "تم الطلب"/"ملقيتوش" status is stale either way, so clear it.
        if (row.currentStock !== undefined) {
          if (row.currentStock > existing.currentStock) {
            existing.orderStatus = undefined
            existing.orderStatusAt = undefined
          }
          existing.currentStock = row.currentStock
        }
        if (row.minStock !== undefined) existing.minStock = row.minStock
        if (row.purchasePrice !== undefined) existing.purchasePrice = row.purchasePrice
        if (row.salePrice !== undefined) existing.salePrice = row.salePrice
        if (supplierId) existing.supplierId = supplierId
        existing.updatedAt = today()
        touchedItems.push(existing)
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
        nextItems.push(newItem)
        byName.set(nameKey, newItem)
        if (codeKey) byCode.set(codeKey, newItem)
        touchedItems.push(newItem)
      }
    }

    setItems(nextItems)
    setSuppliers(nextSuppliers)
    Promise.all([cloud.upsertSuppliers(touchedSuppliers), cloud.upsertItems(touchedItems)]).catch(reportSyncError)
    return { added, updated, newSuppliers }
  }

  const importItemSales = (rows: ParsedSalesRow[], periodDays: number) => {
    let matched = 0
    let skipped = 0
    const touchedItems: Item[] = []

    setItems((prevItems) => {
      const items = [...prevItems]
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
        const existing = codeKey ? byCode.get(codeKey) : byName.get(nameKey)

        // Rows with no matching item are usually pharmacy services (delivery, injections,
        // Inbody sessions, home visits...) rather than stocked products — skip them instead
        // of polluting the inventory with fake zero-stock "items".
        if (existing) {
          matched++
          existing.avgDailySales = avgDailySales
          existing.salesPeriodDays = periodDays
          existing.updatedAt = today()
          touchedItems.push(existing)
        } else {
          skipped++
        }
      }

      return items
    })

    cloud.upsertItems(touchedItems).catch(reportSyncError)
    return { matched, skipped }
  }

  const setItemOrderStatus = (id: string, status: Item['orderStatus']) => {
    let touched: Item | undefined
    setItems((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x
        touched = { ...x, orderStatus: status, orderStatusAt: status ? today() : undefined }
        return touched
      }),
    )
    if (touched) cloud.upsertItems([touched]).catch(reportSyncError)
  }

  const addSupplier = (s: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = { ...s, id: uid('sup') }
    setSuppliers((prev) => [...prev, newSupplier])
    cloud.upsertSuppliers([newSupplier]).catch(reportSyncError)
  }

  const updateSupplier = (s: Supplier) => {
    setSuppliers((prev) => prev.map((x) => (x.id === s.id ? s : x)))
    cloud.upsertSuppliers([s]).catch(reportSyncError)
  }

  const deleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((x) => x.id !== id))
    setSupplierTransactions((prev) => prev.filter((x) => x.supplierId !== id))
    setItems((prev) => prev.map((it) => (it.supplierId === id ? { ...it, supplierId: undefined } : it)))
    Promise.all([cloud.deleteSupplierTransactionsForSupplier(id), cloud.clearSupplierFromItems(id), cloud.deleteSupplierRow(id)]).catch(
      reportSyncError,
    )
  }

  const addSupplierTransaction = (t: Omit<SupplierTransaction, 'id'>) => {
    const newTxn: SupplierTransaction = { ...t, id: uid('txn') }
    setSupplierTransactions((prev) => [...prev, newTxn])
    cloud.insertSupplierTransaction(newTxn).catch(reportSyncError)
  }

  const deleteSupplierTransaction = (id: string) => {
    setSupplierTransactions((prev) => prev.filter((x) => x.id !== id))
    cloud.deleteSupplierTransactionRow(id).catch(reportSyncError)
  }

  const addEmergencyPurchase = (p: Omit<EmergencyPurchase, 'id'>) => {
    const newPurchase: EmergencyPurchase = { ...p, id: uid('emg') }
    setEmergencyPurchases((prev) => [...prev, newPurchase])
    cloud.upsertEmergencyPurchase(newPurchase).catch(reportSyncError)
  }

  const updateEmergencyPurchase = (p: EmergencyPurchase) => {
    setEmergencyPurchases((prev) => prev.map((x) => (x.id === p.id ? p : x)))
    cloud.upsertEmergencyPurchase(p).catch(reportSyncError)
  }

  const deleteEmergencyPurchase = (id: string) => {
    setEmergencyPurchases((prev) => prev.filter((x) => x.id !== id))
    cloud.deleteEmergencyPurchaseRow(id).catch(reportSyncError)
  }

  return {
    data: { records, items, suppliers, supplierTransactions, emergencyPurchases },
    cloudStatus,
    cloudSyncError,
    dismissCloudSyncError,
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
    setItemOrderStatus,
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
