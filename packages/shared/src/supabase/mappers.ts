import type { Database } from './database.types'
import type {
  Address,
  Category,
  CourierLocation,
  DeliveryAssignment,
  Medicine,
  Order,
  OrderItem,
  OrderStatusEvent,
  Payment,
  Prescription,
  Profile,
} from '../types'

type Row<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']

export function mapProfile(row: Row<'profiles'>): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    role: row.role,
    expoPushToken: row.expo_push_token,
    createdAt: row.created_at,
  }
}

export function mapAddress(row: Row<'addresses'>): Address {
  return {
    id: row.id,
    customerId: row.customer_id,
    label: row.label,
    governorate: row.governorate,
    city: row.city,
    street: row.street,
    building: row.building,
    floor: row.floor,
    apartment: row.apartment,
    landmark: row.landmark,
    lat: row.lat,
    lng: row.lng,
    isDefault: row.is_default,
    createdAt: row.created_at,
  }
}

export function mapCategory(row: Row<'categories'>): Category {
  return { id: row.id, nameAr: row.name_ar, slug: row.slug, sortOrder: row.sort_order }
}

export function mapMedicine(row: Row<'medicines'>): Medicine {
  return {
    id: row.id,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    descriptionAr: row.description_ar,
    categoryId: row.category_id,
    sku: row.sku,
    manufacturer: row.manufacturer,
    price: Number(row.price),
    stockQuantity: row.stock_quantity,
    requiresPrescription: row.requires_prescription,
    imageUrl: row.image_url,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapOrder(row: Row<'orders'>): Order {
  return {
    id: row.id,
    customerId: row.customer_id,
    addressId: row.address_id,
    status: row.status as Order['status'],
    paymentMethod: row.payment_method as Order['paymentMethod'],
    paymentStatus: row.payment_status as Order['paymentStatus'],
    subtotal: Number(row.subtotal),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    prescriptionId: row.prescription_id,
    courierId: row.courier_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapOrderItem(row: Row<'order_items'>): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    medicineId: row.medicine_id,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
    lineTotal: Number(row.line_total),
  }
}

export function mapOrderStatusEvent(row: Row<'order_status_events'>): OrderStatusEvent {
  return {
    id: row.id,
    orderId: row.order_id,
    status: row.status as OrderStatusEvent['status'],
    note: row.note,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}

export function mapPrescription(row: Row<'prescriptions'>): Prescription {
  return {
    id: row.id,
    customerId: row.customer_id,
    orderId: row.order_id,
    imagePath: row.image_path,
    status: row.status,
    reviewedBy: row.reviewed_by,
    reviewerNotes: row.reviewer_notes,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  }
}

export function mapPayment(row: Row<'payments'>): Payment {
  return {
    id: row.id,
    orderId: row.order_id,
    provider: 'paymob',
    paymobOrderId: row.paymob_order_id,
    paymobTransactionId: row.paymob_transaction_id,
    amount: Number(row.amount),
    status: row.status as Payment['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapDeliveryAssignment(row: Row<'delivery_assignments'>): DeliveryAssignment {
  return {
    id: row.id,
    orderId: row.order_id,
    courierId: row.courier_id,
    status: row.status,
    assignedAt: row.assigned_at,
    deliveredAt: row.delivered_at,
  }
}

export function mapCourierLocation(row: Row<'courier_locations'>): CourierLocation {
  return {
    courierId: row.courier_id,
    orderId: row.order_id,
    lat: Number(row.lat),
    lng: Number(row.lng),
    updatedAt: row.updated_at,
  }
}
