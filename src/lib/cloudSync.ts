import { supabase } from './supabaseClient'
import type { EmergencyPurchase, Item, Supplier, SupplierTransaction } from '../types'

// Bulk writes are chunked so importing a large catalog (thousands of items)
// doesn't send one oversized request.
const CHUNK_SIZE = 500

async function chunked<T>(rows: T[], fn: (chunk: T[]) => PromiseLike<{ error: { message: string } | null }>) {
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE)
    const { error } = await fn(chunk)
    if (error) throw new Error(error.message)
  }
}

// Postgrest returns at most ~1000 rows per request by default, so a full-table
// read needs to page through with .range() until a page comes back short.
async function fetchAll<T>(table: string): Promise<T[]> {
  const rows: T[] = []
  const pageSize = 1000
  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + pageSize - 1)
    if (error) throw new Error(error.message)
    rows.push(...((data ?? []) as T[]))
    if (!data || data.length < pageSize) break
    from += pageSize
  }
  return rows
}

// ---------- items ----------

interface ItemRow {
  id: string
  name: string
  code: string | null
  unit: string | null
  category: string | null
  current_stock: number
  min_stock: number
  purchase_price: number | null
  sale_price: number | null
  supplier_id: string | null
  updated_at: string
  avg_daily_sales: number | null
  sales_period_days: number | null
  order_status: string | null
  order_status_at: string | null
}

function itemToRow(item: Item): ItemRow {
  return {
    id: item.id,
    name: item.name,
    code: item.code ?? null,
    unit: item.unit ?? null,
    category: item.category ?? null,
    current_stock: item.currentStock,
    min_stock: item.minStock,
    purchase_price: item.purchasePrice ?? null,
    sale_price: item.salePrice ?? null,
    supplier_id: item.supplierId ?? null,
    updated_at: item.updatedAt,
    avg_daily_sales: item.avgDailySales ?? null,
    sales_period_days: item.salesPeriodDays ?? null,
    order_status: item.orderStatus ?? null,
    order_status_at: item.orderStatusAt ?? null,
  }
}

function rowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    code: row.code ?? undefined,
    unit: row.unit ?? undefined,
    category: row.category ?? undefined,
    currentStock: row.current_stock,
    minStock: row.min_stock,
    purchasePrice: row.purchase_price ?? undefined,
    salePrice: row.sale_price ?? undefined,
    supplierId: row.supplier_id ?? undefined,
    updatedAt: row.updated_at,
    avgDailySales: row.avg_daily_sales ?? undefined,
    salesPeriodDays: row.sales_period_days ?? undefined,
    orderStatus: (row.order_status as Item['orderStatus']) ?? undefined,
    orderStatusAt: row.order_status_at ?? undefined,
  }
}

export async function fetchItems(): Promise<Item[]> {
  const rows = await fetchAll<ItemRow>('items')
  return rows.map(rowToItem)
}

export async function upsertItems(items: Item[]): Promise<void> {
  if (items.length === 0) return
  const rows = items.map(itemToRow)
  await chunked(rows, (chunk) => supabase.from('items').upsert(chunk))
}

export async function deleteItemRow(id: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function clearSupplierFromItems(supplierId: string): Promise<void> {
  const { error } = await supabase.from('items').update({ supplier_id: null }).eq('supplier_id', supplierId)
  if (error) throw new Error(error.message)
}

// ---------- suppliers ----------

interface SupplierRow {
  id: string
  name: string
  phone: string | null
  notes: string | null
}

function supplierToRow(s: Supplier): SupplierRow {
  return { id: s.id, name: s.name, phone: s.phone ?? null, notes: s.notes ?? null }
}

function rowToSupplier(row: SupplierRow): Supplier {
  return { id: row.id, name: row.name, phone: row.phone ?? undefined, notes: row.notes ?? undefined }
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  const rows = await fetchAll<SupplierRow>('suppliers')
  return rows.map(rowToSupplier)
}

export async function upsertSuppliers(suppliers: Supplier[]): Promise<void> {
  if (suppliers.length === 0) return
  const rows = suppliers.map(supplierToRow)
  await chunked(rows, (chunk) => supabase.from('suppliers').upsert(chunk))
}

export async function deleteSupplierRow(id: string): Promise<void> {
  const { error } = await supabase.from('suppliers').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------- supplier transactions ----------

interface SupplierTransactionRow {
  id: string
  supplier_id: string
  date: string
  type: string
  amount: number
  note: string | null
}

function supplierTransactionToRow(t: SupplierTransaction): SupplierTransactionRow {
  return { id: t.id, supplier_id: t.supplierId, date: t.date, type: t.type, amount: t.amount, note: t.note ?? null }
}

function rowToSupplierTransaction(row: SupplierTransactionRow): SupplierTransaction {
  return {
    id: row.id,
    supplierId: row.supplier_id,
    date: row.date,
    type: row.type as SupplierTransaction['type'],
    amount: row.amount,
    note: row.note ?? undefined,
  }
}

export async function fetchSupplierTransactions(): Promise<SupplierTransaction[]> {
  const rows = await fetchAll<SupplierTransactionRow>('supplier_transactions')
  return rows.map(rowToSupplierTransaction)
}

export async function insertSupplierTransaction(t: SupplierTransaction): Promise<void> {
  const { error } = await supabase.from('supplier_transactions').insert(supplierTransactionToRow(t))
  if (error) throw new Error(error.message)
}

export async function deleteSupplierTransactionRow(id: string): Promise<void> {
  const { error } = await supabase.from('supplier_transactions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteSupplierTransactionsForSupplier(supplierId: string): Promise<void> {
  const { error } = await supabase.from('supplier_transactions').delete().eq('supplier_id', supplierId)
  if (error) throw new Error(error.message)
}

// ---------- emergency purchases ----------

interface EmergencyPurchaseRow {
  id: string
  date: string
  item_id: string | null
  item_name: string
  source_pharmacy: string | null
  quantity: number | null
  public_price: number | null
  cost_price: number | null
  note: string | null
}

function emergencyPurchaseToRow(p: EmergencyPurchase): EmergencyPurchaseRow {
  return {
    id: p.id,
    date: p.date,
    item_id: p.itemId ?? null,
    item_name: p.itemName,
    source_pharmacy: p.sourcePharmacy ?? null,
    quantity: p.quantity ?? null,
    public_price: p.publicPrice ?? null,
    cost_price: p.costPrice ?? null,
    note: p.note ?? null,
  }
}

function rowToEmergencyPurchase(row: EmergencyPurchaseRow): EmergencyPurchase {
  return {
    id: row.id,
    date: row.date,
    itemId: row.item_id ?? undefined,
    itemName: row.item_name,
    sourcePharmacy: row.source_pharmacy ?? undefined,
    quantity: row.quantity ?? undefined,
    publicPrice: row.public_price ?? undefined,
    costPrice: row.cost_price ?? undefined,
    note: row.note ?? undefined,
  }
}

export async function fetchEmergencyPurchases(): Promise<EmergencyPurchase[]> {
  const rows = await fetchAll<EmergencyPurchaseRow>('emergency_purchases')
  return rows.map(rowToEmergencyPurchase)
}

export async function upsertEmergencyPurchase(p: EmergencyPurchase): Promise<void> {
  const { error } = await supabase.from('emergency_purchases').upsert(emergencyPurchaseToRow(p))
  if (error) throw new Error(error.message)
}

export async function deleteEmergencyPurchaseRow(id: string): Promise<void> {
  const { error } = await supabase.from('emergency_purchases').delete().eq('id', id)
  if (error) throw new Error(error.message)
}
