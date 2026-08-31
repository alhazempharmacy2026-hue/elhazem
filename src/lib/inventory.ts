import type { EmergencyPurchase, Item, Supplier, SupplierTransaction } from '../types'

export type StockStatus = 'out' | 'low' | 'ok'

export function stockStatus(item: Item): StockStatus {
  if (item.currentStock <= 0) return 'out'
  if (item.minStock > 0 && item.currentStock <= item.minStock) return 'low'
  return 'ok'
}

export const STATUS_LABEL: Record<StockStatus, string> = {
  out: 'نفد',
  low: 'منخفض',
  ok: 'كويس',
}

export function lowStockItems(items: Item[]): Item[] {
  return items
    .filter((i) => stockStatus(i) !== 'ok')
    .sort((a, b) => {
      const sa = stockStatus(a)
      const sb = stockStatus(b)
      if (sa !== sb) return sa === 'out' ? -1 : 1
      return a.currentStock - a.minStock - (b.currentStock - b.minStock)
    })
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

export function isThisMonth(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}
