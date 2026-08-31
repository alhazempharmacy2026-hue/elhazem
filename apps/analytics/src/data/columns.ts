import type { DailyRecord } from '../types'

export interface ColumnDef {
  key: keyof DailyRecord
  label: string
  kind: 'date' | 'number' | 'text'
}

// Mirrors the columns of the pharmacy's daily-tracking Google Sheet, in order.
// Import matches by Arabic header text, so column order in an uploaded file doesn't matter.
export const COLUMNS: ColumnDef[] = [
  { key: 'date', label: 'التاريخ', kind: 'date' },
  { key: 'invoiceCount', label: 'عدد الفواتير', kind: 'number' },
  { key: 'deliveryCount', label: 'عدد فواتير الدليفري', kind: 'number' },
  { key: 'cashCount', label: 'عدد فواتير الكاش', kind: 'number' },
  { key: 'cashPayCount', label: 'عدد فواتير نقدي', kind: 'number' },
  { key: 'cashValue', label: 'قيمة الفواتير النقدية', kind: 'number' },
  { key: 'nonCashCount', label: 'عدد فواتير غير نقدية', kind: 'number' },
  { key: 'nonCashValue', label: 'قيمة الفواتير غير النقدية', kind: 'number' },
  { key: 'creditCount', label: 'عدد فواتير اجل', kind: 'number' },
  { key: 'creditValue', label: 'قيمة فواتير اجل', kind: 'number' },
  { key: 'pendingCount', label: 'عدد الفواتير المعلقة', kind: 'number' },
  { key: 'pendingValue', label: 'فيمة الفواتير المعلقة', kind: 'number' },
  { key: 'totalSales', label: 'اجمالي مبيعات اليوم', kind: 'number' },
  { key: 'avgInvoice', label: 'متوسط الفاتورة', kind: 'number' },
  { key: 'invoicesWithCode', label: 'عدد الفواتير المسجلة بكود', kind: 'number' },
  { key: 'invoicesWithoutCode', label: 'عدد الفواتير بدون كود', kind: 'number' },
  { key: 'newCodes', label: 'عدد الاكواد الجديدة', kind: 'number' },
  { key: 'invoicesOver1000', label: 'عدد الفواتير فوق 1000', kind: 'number' },
  { key: 'invoices500to1000', label: 'عدد الفواتير من 500:1000', kind: 'number' },
  { key: 'invoices300to500', label: 'عدد الفواتير من 300:500', kind: 'number' },
  { key: 'invoices200to300', label: 'عدد الفواتير من 200:300', kind: 'number' },
  { key: 'invoices100to200', label: 'عدد الفواتير من 100:200', kind: 'number' },
  { key: 'invoicesUnder100', label: 'عدد الفواتير اقل من 100', kind: 'number' },
  { key: 'netProfit', label: 'صافي الربح من سعر الشراء بعد الخصم', kind: 'number' },
  { key: 'peakHour', label: 'اكتر ساعة نشطة', kind: 'text' },
  { key: 'uniqueCustomers', label: 'عدد الاكواد المختلفة المشتراه', kind: 'number' },
  { key: 'pharmacyPurchaseInvoices', label: 'عدد فواتير الصيدليات', kind: 'number' },
  { key: 'weakDiscountItems', label: 'عدد الاصناف المشتراه من صيدليات بخصم ضعيف', kind: 'number' },
  { key: 'pharmacyPurchasePublicPrice', label: 'اسعار جمهور اصناف الصيدليات المشتراه', kind: 'number' },
  { key: 'profitPercent', label: 'النسبة المئوية لصافي الربح', kind: 'number' },
  { key: 'deliveryRatio', label: 'نسبة فواتير الدليفري من الاجمالي', kind: 'number' },
  { key: 'purchaseToSaleRatio', label: 'النسبة المئوية لاسعار الاصناف المشتراه مقارنة باجمالي البيع', kind: 'number' },
  { key: 'avgProfitPerInvoice', label: 'متوسط ربح الفاتورة', kind: 'number' },
  { key: 'slimmingInjections', label: 'عدد جرعات حقن التخسيس اليوم', kind: 'number' },
  { key: 'inbodySessions', label: 'عدد جلسات الإنبودي اليوم', kind: 'number' },
  { key: 'returnsCount', label: 'عدد المرتجعات', kind: 'number' },
  { key: 'returnsValue', label: 'قيمة المرتجعات', kind: 'number' },
]

// A couple of headers have alternate spellings seen in the wild (e.g. typoed hamza).
export const HEADER_ALIASES: Record<string, keyof DailyRecord> = {
  'قيمة الفواتير المعلقة': 'pendingValue',
}
