export interface DailyRecord {
  id: string
  date: string // ISO date (yyyy-mm-dd)

  invoiceCount?: number // عدد الفواتير
  deliveryCount?: number // عدد فواتير الدليفري
  cashCount?: number // عدد فواتير الكاش
  cashPayCount?: number // عدد فواتير نقدي
  cashValue?: number // قيمة الفواتير النقدية
  nonCashCount?: number // عدد فواتير غير نقدية
  nonCashValue?: number // قيمة الفواتير غير النقدية
  creditCount?: number // عدد فواتير اجل (دين)
  creditValue?: number // قيمة فواتير اجل (دين)
  pendingCount?: number // عدد الفواتير المعلقة
  pendingValue?: number // قيمة الفواتير المعلقة

  totalSales?: number // اجمالي مبيعات اليوم
  avgInvoice?: number // متوسط الفاتورة

  invoicesWithCode?: number // عدد الفواتير المسجلة بكود
  invoicesWithoutCode?: number // عدد الفواتير بدون كود
  newCodes?: number // عدد الاكواد الجديدة

  invoicesOver1000?: number
  invoices500to1000?: number
  invoices300to500?: number
  invoices200to300?: number
  invoices100to200?: number
  invoicesUnder100?: number

  netProfit?: number // صافي الربح من سعر الشراء بعد الخصم
  peakHour?: string // اكتر ساعة نشطة
  uniqueCustomers?: number // عدد الاكواد المختلفة المشتراه

  pharmacyPurchaseInvoices?: number // عدد فواتير الصيدليات
  weakDiscountItems?: number // عدد الاصناف المشتراه من صيدليات بخصم ضعيف
  pharmacyPurchasePublicPrice?: number // اسعار جمهور اصناف الصيدليات المشتراه

  profitPercent?: number // النسبة المئوية لصافي الربح
  deliveryRatio?: number // نسبة فواتير الدليفري من الاجمالي
  purchaseToSaleRatio?: number // النسبة المئوية لاسعار الاصناف المشتراه مقارنة باجمالي البيع
  avgProfitPerInvoice?: number // متوسط ربح الفاتورة

  slimmingInjections?: number // عدد جرعات حقن التخسيس اليوم
  inbodySessions?: number // عدد جلسات الإنبودي اليوم
  returnsCount?: number // عدد المرتجعات
  returnsValue?: number // قيمة المرتجعات
}

export interface AppData {
  records: DailyRecord[]
}
