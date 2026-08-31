import type { DeliveryAssignmentStatus, OrderStatus, PaymentMethod, PaymentStatus, UserRole } from '../types'

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending_payment: 'بانتظار الدفع',
  placed: 'تم استلام الطلب',
  pharmacist_review: 'مراجعة الروشتة',
  confirmed: 'تم تأكيد الطلب',
  preparing: 'جاري التجهيز',
  out_for_delivery: 'في الطريق إليك',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
  rejected: 'مرفوض',
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  paymob_card: 'بطاقة ائتمان/خصم',
  paymob_wallet: 'محفظة إلكترونية',
  cash_on_delivery: 'الدفع عند الاستلام',
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: 'لم يُدفع بعد',
  pending: 'جاري التأكيد',
  paid: 'تم الدفع',
  failed: 'فشلت عملية الدفع',
  refunded: 'تم الاسترداد',
}

export const deliveryStatusLabels: Record<DeliveryAssignmentStatus, string> = {
  assigned: 'تم تعيين مندوب',
  picked_up: 'استلم المندوب الطلب',
  en_route: 'المندوب في الطريق',
  delivered: 'تم التسليم',
  failed: 'محاولة تسليم فاشلة',
}

export const roleLabels: Record<UserRole, string> = {
  customer: 'عميل',
  pharmacist: 'صيدلي',
  admin: 'مدير',
  courier: 'مندوب توصيل',
}

export const prescriptionStatusLabels = {
  pending: 'قيد المراجعة',
  approved: 'تمت الموافقة',
  rejected: 'مرفوضة',
} as const
