import {
  DEFAULT_DELIVERY_FEE,
  cartRequiresPrescription,
  cartSubtotal,
  type CartItem,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PaymentMethod,
} from '@elhazem/shared'
import { demoAddress, demoProfile } from './demoData'

// محاكاة بسيطة لدورة حياة الطلب في الوضع التجريبي (بدون Supabase) — الحالة بتتقدم تلقائيًا
// حسب الوقت اللي عدى من إنشاء الطلب، ومحفوظة في localStorage عشان تفضل موجودة لو عملت refresh.

interface StoredDemoOrder {
  id: string
  createdAt: string
  items: CartItem[]
  paymentMethod: PaymentMethod
  subtotal: number
  deliveryFee: number
  total: number
  requiresPrescription: boolean
}

const KEY = 'elhazem-demo-orders'

function readAll(): StoredDemoOrder[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as StoredDemoOrder[]) : []
  } catch {
    return []
  }
}

function writeAll(orders: StoredDemoOrder[]) {
  localStorage.setItem(KEY, JSON.stringify(orders))
}

export function placeDemoOrder(items: CartItem[], paymentMethod: PaymentMethod): Order {
  const stored: StoredDemoOrder = {
    id: `demo-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    items,
    paymentMethod,
    subtotal: cartSubtotal(items),
    deliveryFee: DEFAULT_DELIVERY_FEE,
    total: cartSubtotal(items) + DEFAULT_DELIVERY_FEE,
    requiresPrescription: cartRequiresPrescription(items),
  }
  const all = readAll()
  all.unshift(stored)
  writeAll(all)
  return toOrder(stored)
}

// خط زمني (بالثواني من وقت الإنشاء) — بيتقدم لوحده عشان تقدر تتفرج على شاشة التتبع وهي بتتحرك
function timelineFor(requiresPrescription: boolean): [OrderStatus, number][] {
  return requiresPrescription
    ? [
        ['placed', 0],
        ['pharmacist_review', 4],
        ['confirmed', 10],
        ['preparing', 18],
        ['out_for_delivery', 26],
        ['delivered', 40],
      ]
    : [
        ['placed', 0],
        ['confirmed', 6],
        ['preparing', 14],
        ['out_for_delivery', 22],
        ['delivered', 36],
      ]
}

function computeStatus(stored: StoredDemoOrder): OrderStatus {
  const elapsedSeconds = (Date.now() - new Date(stored.createdAt).getTime()) / 1000
  let status: OrderStatus = 'placed'
  for (const [candidate, atSeconds] of timelineFor(stored.requiresPrescription)) {
    if (elapsedSeconds >= atSeconds) status = candidate
  }
  return status
}

function toOrder(stored: StoredDemoOrder): Order {
  return {
    id: stored.id,
    customerId: demoProfile.id,
    addressId: demoAddress.id,
    status: computeStatus(stored),
    paymentMethod: stored.paymentMethod,
    paymentStatus: stored.paymentMethod === 'cash_on_delivery' ? 'unpaid' : 'paid',
    subtotal: stored.subtotal,
    deliveryFee: stored.deliveryFee,
    total: stored.total,
    prescriptionId: stored.requiresPrescription ? 'demo-prescription' : null,
    courierId: computeStatus(stored) === 'out_for_delivery' || computeStatus(stored) === 'delivered' ? 'demo-courier' : null,
    notes: null,
    createdAt: stored.createdAt,
    updatedAt: new Date().toISOString(),
  }
}

export function listDemoOrders(): Order[] {
  return readAll().map(toOrder)
}

export function getDemoOrder(id: string): Order | null {
  const found = readAll().find((o) => o.id === id)
  return found ? toOrder(found) : null
}

export function getDemoOrderItems(id: string): OrderItem[] {
  const found = readAll().find((o) => o.id === id)
  if (!found) return []
  return found.items.map((item) => ({
    id: `${id}-${item.medicineId}`,
    orderId: id,
    medicineId: item.medicineId,
    quantity: item.quantity,
    unitPrice: item.medicine.price,
    lineTotal: item.medicine.price * item.quantity,
  }))
}

// موقع مندوب وهمي بيتحرك تدريجيًا نحو عنوان العميل التجريبي أثناء "في الطريق إليك"
export function getDemoCourierLocation(order: Order): { lat: number; lng: number } | null {
  if (order.status !== 'out_for_delivery') return null
  const start = { lat: 30.0561, lng: 31.3238 }
  const end = { lat: 30.0731, lng: 31.3467 }
  const elapsedSeconds = (Date.now() - new Date(order.createdAt).getTime()) / 1000
  const progress = Math.min(1, Math.max(0, (elapsedSeconds - 22) / 14))
  return {
    lat: start.lat + (end.lat - start.lat) * progress,
    lng: start.lng + (end.lng - start.lng) * progress,
  }
}
