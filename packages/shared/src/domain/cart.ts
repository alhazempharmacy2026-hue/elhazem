import type { CartItem } from '../types'

export const DEFAULT_DELIVERY_FEE = 20

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.medicine.price * item.quantity, 0)
}

export function cartTotal(items: CartItem[], deliveryFee = DEFAULT_DELIVERY_FEE): number {
  return cartSubtotal(items) + deliveryFee
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export function cartRequiresPrescription(items: CartItem[]): boolean {
  return items.some((item) => item.medicine.requiresPrescription)
}

export function upsertCartItem(items: CartItem[], next: CartItem): CartItem[] {
  const existingIndex = items.findIndex((item) => item.medicineId === next.medicineId)
  if (existingIndex === -1) return [...items, next]
  const updated = [...items]
  updated[existingIndex] = next
  return updated
}

export function removeCartItem(items: CartItem[], medicineId: string): CartItem[] {
  return items.filter((item) => item.medicineId !== medicineId)
}

export function setCartItemQuantity(items: CartItem[], medicineId: string, quantity: number): CartItem[] {
  if (quantity <= 0) return removeCartItem(items, medicineId)
  return items.map((item) => (item.medicineId === medicineId ? { ...item, quantity } : item))
}
