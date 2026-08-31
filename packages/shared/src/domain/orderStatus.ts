import type { OrderStatus } from '../types'

// الترتيب الزمني المتوقع للطلب العادي (بدون رفض/إلغاء) — تُستخدم في شاشة التتبع لرسم خط زمني
export const ORDER_STATUS_TIMELINE: OrderStatus[] = [
  'placed',
  'pharmacist_review',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
]

const TERMINAL_STATUSES: OrderStatus[] = ['delivered', 'cancelled', 'rejected']

export function isOrderTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

export function isOrderActive(status: OrderStatus): boolean {
  return !isOrderTerminal(status)
}

export function orderTimelineIndex(status: OrderStatus): number {
  return ORDER_STATUS_TIMELINE.indexOf(status)
}
