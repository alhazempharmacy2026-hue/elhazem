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

export interface Item {
  id: string
  name: string // اسم الصنف
  code?: string // كود / باركود
  unit?: string // الوحدة (علبة، شريط...)
  category?: string // التصنيف
  currentStock: number // الكمية الحالية
  minStock: number // حد الطلب الأدنى (نقطة إعادة الطلب)
  purchasePrice?: number // سعر الشراء
  salePrice?: number // سعر البيع
  supplierId?: string // المورد المفضل
  updatedAt: string // ISO date - آخر تحديث

  avgDailySales?: number // متوسط الكمية المباعة يوميًا (من تقرير مبيعات الأصناف)
  salesPeriodDays?: number // عدد الأيام اللي اتحسب منها المتوسط (للمرجعية)
}

export interface Supplier {
  id: string
  name: string
  phone?: string
  notes?: string
}

export interface SupplierTransaction {
  id: string
  supplierId: string
  date: string // ISO date
  type: 'purchase' | 'payment' // شراء بالآجل (يزود الدين) / سداد (يقلل الدين)
  amount: number
  note?: string
}

export interface EmergencyPurchase {
  id: string
  date: string // ISO date
  itemId?: string // ربط بصنف في المخزون لو موجود
  itemName: string // اسم الصنف
  sourcePharmacy?: string // اتشرى منين (اسم الصيدلية/المورد)
  quantity?: number
  publicPrice?: number // سعر الجمهور (سعر البيع الأصلي للصنف)
  costPrice?: number // السعر اللي اتدفع فعليًا (بخصم ضعيف غالبًا)
  note?: string
}

export interface AppData {
  records: DailyRecord[]
  items: Item[]
  suppliers: Supplier[]
  supplierTransactions: SupplierTransaction[]
  emergencyPurchases: EmergencyPurchase[]
}
