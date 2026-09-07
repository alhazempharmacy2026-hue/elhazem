import { supabase } from './supabaseClient'
import type { DailyRecord, EmergencyPurchase, Item, Supplier, SupplierTransaction } from '../types'

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

// ---------- daily records ----------

interface DailyRecordRow {
  id: string
  date: string
  invoice_count: number | null
  delivery_count: number | null
  cash_count: number | null
  cash_pay_count: number | null
  cash_value: number | null
  non_cash_count: number | null
  non_cash_value: number | null
  credit_count: number | null
  credit_value: number | null
  pending_count: number | null
  pending_value: number | null
  total_sales: number | null
  avg_invoice: number | null
  invoices_with_code: number | null
  invoices_without_code: number | null
  new_codes: number | null
  invoices_over_1000: number | null
  invoices_500_to_1000: number | null
  invoices_300_to_500: number | null
  invoices_200_to_300: number | null
  invoices_100_to_200: number | null
  invoices_under_100: number | null
  net_profit: number | null
  peak_hour: string | null
  unique_customers: number | null
  pharmacy_purchase_invoices: number | null
  weak_discount_items: number | null
  pharmacy_purchase_public_price: number | null
  profit_percent: number | null
  delivery_ratio: number | null
  purchase_to_sale_ratio: number | null
  avg_profit_per_invoice: number | null
  slimming_injections: number | null
  inbody_sessions: number | null
  returns_count: number | null
  returns_value: number | null
}

function dailyRecordToRow(r: DailyRecord): DailyRecordRow {
  return {
    id: r.id,
    date: r.date,
    invoice_count: r.invoiceCount ?? null,
    delivery_count: r.deliveryCount ?? null,
    cash_count: r.cashCount ?? null,
    cash_pay_count: r.cashPayCount ?? null,
    cash_value: r.cashValue ?? null,
    non_cash_count: r.nonCashCount ?? null,
    non_cash_value: r.nonCashValue ?? null,
    credit_count: r.creditCount ?? null,
    credit_value: r.creditValue ?? null,
    pending_count: r.pendingCount ?? null,
    pending_value: r.pendingValue ?? null,
    total_sales: r.totalSales ?? null,
    avg_invoice: r.avgInvoice ?? null,
    invoices_with_code: r.invoicesWithCode ?? null,
    invoices_without_code: r.invoicesWithoutCode ?? null,
    new_codes: r.newCodes ?? null,
    invoices_over_1000: r.invoicesOver1000 ?? null,
    invoices_500_to_1000: r.invoices500to1000 ?? null,
    invoices_300_to_500: r.invoices300to500 ?? null,
    invoices_200_to_300: r.invoices200to300 ?? null,
    invoices_100_to_200: r.invoices100to200 ?? null,
    invoices_under_100: r.invoicesUnder100 ?? null,
    net_profit: r.netProfit ?? null,
    peak_hour: r.peakHour ?? null,
    unique_customers: r.uniqueCustomers ?? null,
    pharmacy_purchase_invoices: r.pharmacyPurchaseInvoices ?? null,
    weak_discount_items: r.weakDiscountItems ?? null,
    pharmacy_purchase_public_price: r.pharmacyPurchasePublicPrice ?? null,
    profit_percent: r.profitPercent ?? null,
    delivery_ratio: r.deliveryRatio ?? null,
    purchase_to_sale_ratio: r.purchaseToSaleRatio ?? null,
    avg_profit_per_invoice: r.avgProfitPerInvoice ?? null,
    slimming_injections: r.slimmingInjections ?? null,
    inbody_sessions: r.inbodySessions ?? null,
    returns_count: r.returnsCount ?? null,
    returns_value: r.returnsValue ?? null,
  }
}

function rowToDailyRecord(row: DailyRecordRow): DailyRecord {
  return {
    id: row.id,
    date: row.date,
    invoiceCount: row.invoice_count ?? undefined,
    deliveryCount: row.delivery_count ?? undefined,
    cashCount: row.cash_count ?? undefined,
    cashPayCount: row.cash_pay_count ?? undefined,
    cashValue: row.cash_value ?? undefined,
    nonCashCount: row.non_cash_count ?? undefined,
    nonCashValue: row.non_cash_value ?? undefined,
    creditCount: row.credit_count ?? undefined,
    creditValue: row.credit_value ?? undefined,
    pendingCount: row.pending_count ?? undefined,
    pendingValue: row.pending_value ?? undefined,
    totalSales: row.total_sales ?? undefined,
    avgInvoice: row.avg_invoice ?? undefined,
    invoicesWithCode: row.invoices_with_code ?? undefined,
    invoicesWithoutCode: row.invoices_without_code ?? undefined,
    newCodes: row.new_codes ?? undefined,
    invoicesOver1000: row.invoices_over_1000 ?? undefined,
    invoices500to1000: row.invoices_500_to_1000 ?? undefined,
    invoices300to500: row.invoices_300_to_500 ?? undefined,
    invoices200to300: row.invoices_200_to_300 ?? undefined,
    invoices100to200: row.invoices_100_to_200 ?? undefined,
    invoicesUnder100: row.invoices_under_100 ?? undefined,
    netProfit: row.net_profit ?? undefined,
    peakHour: row.peak_hour ?? undefined,
    uniqueCustomers: row.unique_customers ?? undefined,
    pharmacyPurchaseInvoices: row.pharmacy_purchase_invoices ?? undefined,
    weakDiscountItems: row.weak_discount_items ?? undefined,
    pharmacyPurchasePublicPrice: row.pharmacy_purchase_public_price ?? undefined,
    profitPercent: row.profit_percent ?? undefined,
    deliveryRatio: row.delivery_ratio ?? undefined,
    purchaseToSaleRatio: row.purchase_to_sale_ratio ?? undefined,
    avgProfitPerInvoice: row.avg_profit_per_invoice ?? undefined,
    slimmingInjections: row.slimming_injections ?? undefined,
    inbodySessions: row.inbody_sessions ?? undefined,
    returnsCount: row.returns_count ?? undefined,
    returnsValue: row.returns_value ?? undefined,
  }
}

export async function fetchDailyRecords(): Promise<DailyRecord[]> {
  const rows = await fetchAll<DailyRecordRow>('daily_records')
  return rows.map(rowToDailyRecord)
}

export async function upsertDailyRecords(records: DailyRecord[]): Promise<void> {
  if (records.length === 0) return
  const rows = records.map(dailyRecordToRow)
  await chunked(rows, (chunk) => supabase.from('daily_records').upsert(chunk))
}

export async function deleteDailyRecordRow(id: string): Promise<void> {
  const { error } = await supabase.from('daily_records').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteAllDailyRecords(): Promise<void> {
  const { error } = await supabase.from('daily_records').delete().not('id', 'is', null)
  if (error) throw new Error(error.message)
}
