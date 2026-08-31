export type UserRole = 'customer' | 'pharmacist' | 'admin' | 'courier'

export interface Profile {
  id: string
  fullName: string | null
  phone: string | null
  role: UserRole
  expoPushToken: string | null
  createdAt: string
}

export interface Address {
  id: string
  customerId: string
  label: string
  governorate: string
  city: string
  street: string
  building: string
  floor: string | null
  apartment: string | null
  landmark: string | null
  lat: number | null
  lng: number | null
  isDefault: boolean
  createdAt: string
}

export interface Category {
  id: string
  nameAr: string
  slug: string
  sortOrder: number
}

export interface Medicine {
  id: string
  nameAr: string
  nameEn: string | null
  descriptionAr: string | null
  categoryId: string | null
  sku: string | null
  manufacturer: string | null
  price: number
  stockQuantity: number
  requiresPrescription: boolean
  imageUrl: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

// ترتيب حالة الطلب من الإنشاء للتسليم — ثابت الترتيب علشان شاشة التتبع تقدر تعرض خط زمني
export type OrderStatus =
  | 'pending_payment'
  | 'placed'
  | 'pharmacist_review'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'rejected'

export type PaymentMethod = 'paymob_card' | 'paymob_wallet' | 'cash_on_delivery'
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'

export interface Order {
  id: string
  customerId: string
  addressId: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  subtotal: number
  deliveryFee: number
  total: number
  prescriptionId: string | null
  courierId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  medicineId: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface OrderStatusEvent {
  id: string
  orderId: string
  status: OrderStatus
  note: string | null
  createdBy: string | null
  createdAt: string
}

export type PrescriptionStatus = 'pending' | 'approved' | 'rejected'

export interface Prescription {
  id: string
  customerId: string
  orderId: string | null
  imagePath: string
  status: PrescriptionStatus
  reviewedBy: string | null
  reviewerNotes: string | null
  createdAt: string
  reviewedAt: string | null
}

export type PaymentTransactionStatus = 'initiated' | 'pending' | 'success' | 'failed' | 'refunded'

export interface Payment {
  id: string
  orderId: string
  provider: 'paymob'
  paymobOrderId: string | null
  paymobTransactionId: string | null
  amount: number
  status: PaymentTransactionStatus
  createdAt: string
  updatedAt: string
}

export type DeliveryAssignmentStatus = 'assigned' | 'picked_up' | 'en_route' | 'delivered' | 'failed'

export interface DeliveryAssignment {
  id: string
  orderId: string
  courierId: string
  status: DeliveryAssignmentStatus
  assignedAt: string
  deliveredAt: string | null
}

export interface CourierLocation {
  courierId: string
  orderId: string | null
  lat: number
  lng: number
  updatedAt: string
}

// عنصر في عربة التسوق — قبل ما يتحول لـ OrderItem فعلي عند تأكيد الطلب
export interface CartItem {
  medicineId: string
  medicine: Medicine
  quantity: number
}
