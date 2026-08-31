import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  cartItemCount,
  cartRequiresPrescription,
  cartSubtotal,
  cartTotal,
  removeCartItem,
  setCartItemQuantity,
  upsertCartItem,
  type CartItem,
  type Medicine,
} from '@elhazem/shared'

const STORAGE_KEY = 'elhazem-cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  requiresPrescription: boolean
  total: (deliveryFee?: number) => number
  addItem: (medicine: Medicine, quantity?: number) => void
  setQuantity: (medicineId: string, quantity: number) => void
  removeItem: (medicineId: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const value: CartContextValue = {
    items,
    itemCount: cartItemCount(items),
    subtotal: cartSubtotal(items),
    requiresPrescription: cartRequiresPrescription(items),
    total: (deliveryFee) => cartTotal(items, deliveryFee),
    addItem(medicine, quantity = 1) {
      setItems((prev) => {
        const existing = prev.find((item) => item.medicineId === medicine.id)
        const nextQuantity = (existing?.quantity ?? 0) + quantity
        return upsertCartItem(prev, { medicineId: medicine.id, medicine, quantity: nextQuantity })
      })
    },
    setQuantity(medicineId, quantity) {
      setItems((prev) => setCartItemQuantity(prev, medicineId, quantity))
    },
    removeItem(medicineId) {
      setItems((prev) => removeCartItem(prev, medicineId))
    },
    clear() {
      setItems([])
    },
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart لازم يُستخدم جوه CartProvider')
  return ctx
}
