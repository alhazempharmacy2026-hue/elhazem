import type { PharmacyData } from '../types'
import { daysUntil } from './format'

export interface DailyPoint {
  date: string
  label: string
  revenue: number
  profit: number
}

export interface CategorySlice {
  category: string
  revenue: number
}

export interface TopItem {
  name: string
  qty: number
  revenue: number
}

export function buildDashboardStats(data: PharmacyData, rangeDays = 30) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - rangeDays)
  const inRange = data.sales.filter((s) => new Date(s.date) >= cutoff)

  const totalRevenue = inRange.reduce((sum, s) => sum + s.total, 0)
  const totalProfit = inRange.reduce(
    (sum, s) => sum + s.items.reduce((isum, it) => isum + (it.unitPrice - it.unitCost) * it.qty, 0),
    0,
  )
  const totalTransactions = inRange.length
  const totalUnitsSold = inRange.reduce((sum, s) => sum + s.items.reduce((isum, it) => isum + it.qty, 0), 0)
  const avgTicket = totalTransactions ? totalRevenue / totalTransactions : 0

  const lowStock = data.medicines.filter((m) => m.stock <= m.minStock).sort((a, b) => a.stock - b.stock)
  const expiringSoon = data.medicines
    .filter((m) => daysUntil(m.expiryDate) <= 30)
    .sort((a, b) => daysUntil(a.expiryDate) - daysUntil(b.expiryDate))

  // daily trend
  const dayMap = new Map<string, DailyPoint>()
  for (let i = rangeDays; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    dayMap.set(key, {
      date: key,
      label: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }),
      revenue: 0,
      profit: 0,
    })
  }
  for (const s of inRange) {
    const key = s.date.slice(0, 10)
    const point = dayMap.get(key)
    if (!point) continue
    point.revenue += s.total
    point.profit += s.items.reduce((isum, it) => isum + (it.unitPrice - it.unitCost) * it.qty, 0)
  }
  const trend = Array.from(dayMap.values())

  // category breakdown
  const categoryMap = new Map<string, number>()
  const medById = new Map(data.medicines.map((m) => [m.id, m]))
  for (const s of inRange) {
    for (const it of s.items) {
      const med = medById.get(it.medicineId)
      const category = med?.category ?? 'أخرى'
      categoryMap.set(category, (categoryMap.get(category) ?? 0) + it.qty * it.unitPrice)
    }
  }
  const categoryBreakdown: CategorySlice[] = Array.from(categoryMap.entries())
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue)

  // top selling items
  const itemMap = new Map<string, TopItem>()
  for (const s of inRange) {
    for (const it of s.items) {
      const existing = itemMap.get(it.medicineId) ?? { name: it.name, qty: 0, revenue: 0 }
      existing.qty += it.qty
      existing.revenue += it.qty * it.unitPrice
      itemMap.set(it.medicineId, existing)
    }
  }
  const topItems = Array.from(itemMap.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6)

  return {
    totalRevenue,
    totalProfit,
    totalTransactions,
    totalUnitsSold,
    avgTicket,
    lowStock,
    expiringSoon,
    trend,
    categoryBreakdown,
    topItems,
    inventoryValue: data.medicines.reduce((sum, m) => sum + m.stock * m.costPrice, 0),
  }
}
