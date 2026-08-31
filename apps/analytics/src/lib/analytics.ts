import type { DailyRecord } from '../types'
import { formatDate } from './format'

function sum(records: DailyRecord[], key: keyof DailyRecord): number {
  return records.reduce((total, r) => total + (Number(r[key]) || 0), 0)
}

function effectiveSales(r: DailyRecord): number {
  if (r.totalSales !== undefined) return r.totalSales
  return (r.cashValue ?? 0) + (r.nonCashValue ?? 0) + (r.creditValue ?? 0) + (r.pendingValue ?? 0)
}

function effectiveInvoiceCount(r: DailyRecord): number {
  if (r.invoiceCount !== undefined) return r.invoiceCount
  return (r.invoicesWithCode ?? 0) + (r.invoicesWithoutCode ?? 0)
}

export interface Aggregate {
  days: number
  totalSales: number
  totalProfit: number
  totalInvoices: number
  totalDeliveryCount: number
  totalReturnsValue: number
  totalReturnsCount: number
  totalNewCodes: number
  totalUniqueCustomers: number
  totalInvoicesWithCode: number
  totalInvoicesWithoutCode: number
  totalWeakDiscountItems: number
  totalPharmacyPurchasePublicPrice: number
  avgInvoiceValue: number
  profitPercent: number
  deliveryRatio: number
  codeRegistrationRatio: number // invoices logged with a customer code, as a share of total invoices
}

export function aggregate(records: DailyRecord[]): Aggregate {
  const totalSales = records.reduce((t, r) => t + effectiveSales(r), 0)
  const totalProfit = sum(records, 'netProfit')
  const totalInvoices = records.reduce((t, r) => t + effectiveInvoiceCount(r), 0)
  const totalDeliveryCount = sum(records, 'deliveryCount')
  const totalReturnsValue = sum(records, 'returnsValue')
  const totalReturnsCount = sum(records, 'returnsCount')
  const totalNewCodes = sum(records, 'newCodes')
  const totalUniqueCustomers = sum(records, 'uniqueCustomers')
  const totalInvoicesWithCode = sum(records, 'invoicesWithCode')
  const totalInvoicesWithoutCode = sum(records, 'invoicesWithoutCode')
  const totalWeakDiscountItems = sum(records, 'weakDiscountItems')
  const totalPharmacyPurchasePublicPrice = sum(records, 'pharmacyPurchasePublicPrice')
  const codedInvoiceTotal = totalInvoicesWithCode + totalInvoicesWithoutCode

  return {
    days: records.length,
    totalSales,
    totalProfit,
    totalInvoices,
    totalDeliveryCount,
    totalReturnsValue,
    totalReturnsCount,
    totalNewCodes,
    totalUniqueCustomers,
    totalInvoicesWithCode,
    totalInvoicesWithoutCode,
    totalWeakDiscountItems,
    totalPharmacyPurchasePublicPrice,
    avgInvoiceValue: totalInvoices ? totalSales / totalInvoices : 0,
    profitPercent: totalSales ? totalProfit / totalSales : 0,
    deliveryRatio: totalInvoices ? totalDeliveryCount / totalInvoices : 0,
    codeRegistrationRatio: codedInvoiceTotal ? totalInvoicesWithCode / codedInvoiceTotal : 0,
  }
}

export interface TrendPoint {
  date: string
  label: string
  sales: number
  profit: number
  invoicesWithCode: number
  invoicesWithoutCode: number
}

export function buildTrend(records: DailyRecord[]): TrendPoint[] {
  return [...records]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((r) => ({
      date: r.date,
      label: formatDate(r.date),
      sales: effectiveSales(r),
      profit: r.netProfit ?? 0,
      invoicesWithCode: r.invoicesWithCode ?? 0,
      invoicesWithoutCode: r.invoicesWithoutCode ?? 0,
    }))
}

export function invoiceBucketTotals(records: DailyRecord[]) {
  return [
    { bucket: 'أقل من 100', value: sum(records, 'invoicesUnder100') },
    { bucket: '100-200', value: sum(records, 'invoices100to200') },
    { bucket: '200-300', value: sum(records, 'invoices200to300') },
    { bucket: '300-500', value: sum(records, 'invoices300to500') },
    { bucket: '500-1000', value: sum(records, 'invoices500to1000') },
    { bucket: 'أكثر من 1000', value: sum(records, 'invoicesOver1000') },
  ]
}

export function paymentBreakdown(records: DailyRecord[]) {
  return [
    { method: 'نقدي', value: sum(records, 'cashValue') },
    { method: 'غير نقدي', value: sum(records, 'nonCashValue') },
    { method: 'آجل', value: sum(records, 'creditValue') },
    { method: 'معلق', value: sum(records, 'pendingValue') },
  ].filter((p) => p.value > 0)
}

export function filterByRange(records: DailyRecord[], startISO: string, endISO: string): DailyRecord[] {
  return records.filter((r) => r.date >= startISO && r.date <= endISO)
}

export function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}
