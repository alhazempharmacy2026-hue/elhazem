import type { DailyRecord } from '../types'

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function rand(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min))
}

export function seedDailyRecords(days = 30): DailyRecord[] {
  const records: DailyRecord[] = []
  for (let i = days - 1; i >= 0; i--) {
    const invoiceCount = rand(100, 180)
    const deliveryCount = Math.round(invoiceCount * (0.35 + Math.random() * 0.25))
    const creditCount = rand(2, 8)
    const creditValue = creditCount * rand(150, 350)
    const pendingCount = rand(0, 4)
    const pendingValue = pendingCount * rand(150, 500)
    const cashPayCount = Math.round(invoiceCount * 0.7)
    const nonCashCount = invoiceCount - cashPayCount - creditCount - pendingCount
    const cashValue = rand(15000, 26000)
    const nonCashValue = rand(6000, 16000)
    const totalSales = cashValue + nonCashValue + creditValue + pendingValue
    const netProfit = Math.round(totalSales * (0.15 + Math.random() * 0.08))
    const withCode = Math.round(invoiceCount * 0.6)
    const withoutCode = invoiceCount - withCode

    records.push({
      id: `rec-${isoDaysAgo(i)}`,
      date: isoDaysAgo(i),
      invoiceCount,
      deliveryCount,
      cashCount: cashPayCount - rand(0, 15),
      cashPayCount,
      cashValue,
      nonCashCount: Math.max(0, nonCashCount),
      nonCashValue,
      creditCount,
      creditValue,
      pendingCount,
      pendingValue,
      totalSales,
      avgInvoice: Number((totalSales / (withCode + withoutCode)).toFixed(2)),
      invoicesWithCode: withCode,
      invoicesWithoutCode: withoutCode,
      newCodes: rand(1, 12),
      invoicesOver1000: rand(2, 9),
      invoices500to1000: rand(8, 25),
      invoices300to500: rand(15, 40),
      invoices200to300: rand(10, 55),
      invoices100to200: rand(25, 90),
      invoicesUnder100: rand(40, 90),
      netProfit,
      peakHour: ['6:00 - 8:00 م', '9pm : 10 pm', '7:00 - 9:00 م', '5pm : 7pm'][rand(0, 3)],
      uniqueCustomers: rand(70, 260),
      pharmacyPurchaseInvoices: rand(0, 6),
      weakDiscountItems: rand(5, 35),
      pharmacyPurchasePublicPrice: rand(2000, 12000),
      profitPercent: Number((netProfit / totalSales).toFixed(4)),
      deliveryRatio: Number((deliveryCount / invoiceCount).toFixed(4)),
      avgProfitPerInvoice: Number((netProfit / invoiceCount).toFixed(2)),
      slimmingInjections: rand(0, 4),
      inbodySessions: rand(0, 2),
      returnsCount: rand(0, 5),
      returnsValue: rand(0, 1200),
    })
  }
  return records
}
