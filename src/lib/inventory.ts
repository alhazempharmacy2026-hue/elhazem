import type { EmergencyPurchase, Item, Supplier, SupplierTransaction } from '../types'

export type StockStatus = 'out' | 'low' | 'ok'

// لو مفيش حد طلب أدنى متحدد يدويًا للصنف، بنعتبره "منخفض" لما الكمية الحالية
// هتخلص خلال أقل من كذا يوم بمعدل بيعه الفعلي — عشان أغلب الأصناف المستوردة
// من برنامج الصيدلية مفيهاش حد طلب أدنى، فمن غير كده مكانش هيظهر أي صنف "منخفض" أبدًا.
const LOW_STOCK_DAYS_FALLBACK = 7

export function stockStatus(item: Item): StockStatus {
  if (item.currentStock <= 0) return 'out'
  if (item.minStock > 0) return item.currentStock <= item.minStock ? 'low' : 'ok'
  if (item.avgDailySales && item.avgDailySales > 0 && item.currentStock / item.avgDailySales <= LOW_STOCK_DAYS_FALLBACK) {
    return 'low'
  }
  return 'ok'
}

export const STATUS_LABEL: Record<StockStatus, string> = {
  out: 'نفد',
  low: 'منخفض',
  ok: 'كويس',
}

export function inventoryValue(items: Item[]): number {
  return items.reduce((sum, i) => sum + i.currentStock * (i.purchasePrice ?? 0), 0)
}

export function supplierBalance(supplierId: string, txns: SupplierTransaction[]): number {
  return txns
    .filter((t) => t.supplierId === supplierId)
    .reduce((sum, t) => sum + (t.type === 'purchase' ? t.amount : -t.amount), 0)
}

export function totalDebt(suppliers: Supplier[], txns: SupplierTransaction[]): number {
  return suppliers.reduce((sum, s) => sum + Math.max(0, supplierBalance(s.id, txns)), 0)
}

export function emergencyExtraCost(purchase: EmergencyPurchase, items: Item[]): number {
  if (!purchase.costPrice || !purchase.quantity) return 0
  const item = purchase.itemId ? items.find((i) => i.id === purchase.itemId) : undefined
  const normalCost = item?.purchasePrice
  if (normalCost === undefined) return 0
  return Math.max(0, (purchase.costPrice - normalCost) * purchase.quantity)
}

// الكمية المقترح طلبها عشان تغطي عدد أيام معين، بناءً على متوسط المبيعات اليومية للصنف
export function suggestedOrderQty(item: Item, coverageDays: number): number | null {
  if (item.avgDailySales === undefined) return null
  const target = item.avgDailySales * coverageDays
  return Math.max(0, Math.ceil(target - item.currentStock))
}

export function isThisMonth(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}
