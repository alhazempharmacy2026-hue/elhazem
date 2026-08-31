import AsyncStorage from '@react-native-async-storage/async-storage'
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
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'

const STORAGE_KEY = 'elhazem_cart_v1'

interface CartContextValue {
  items: CartItem[]
  subtotal: number
  total: number
  count: number
  requiresPrescription: boolean
  addToCart: (medicine: Medicine, quantity?: number) => void
  setQuantity: (medicineId: string, quantity: number) => void
  removeFromCart: (medicineId: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // تحميل العربة المحفوظة محليًا عند بدء التطبيق (العربة نفسها مش محتاجة تتخزن على السيرفر
  // إلا وقت تأكيد الطلب فعليًا عن طريق create_order)
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setItems(JSON.parse(raw) as CartItem[])
      })
      .catch((error) => console.warn('فشل تحميل عربة التسوق المحفوظة', error))
      .finally(() => setHydrated(true))
  }, [])

  useEffect(() => {
    if (!hydrated) return
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch((error) =>
      console.warn('فشل حفظ عربة التسوق', error),
    )
  }, [items, hydrated])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      subtotal: cartSubtotal(items),
      total: cartTotal(items),
      count: cartItemCount(items),
      requiresPrescription: cartRequiresPrescription(items),
      addToCart(medicine, quantity = 1) {
        setItems((prev) => {
          const existing = prev.find((item) => item.medicineId === medicine.id)
          const nextQuantity = (existing?.quantity ?? 0) + quantity
          return upsertCartItem(prev, { medicineId: medicine.id, medicine, quantity: nextQuantity })
        })
      },
      setQuantity(medicineId, quantity) {
        setItems((prev) => setCartItemQuantity(prev, medicineId, quantity))
      },
      removeFromCart(medicineId) {
        setItems((prev) => removeCartItem(prev, medicineId))
      },
      clearCart() {
        setItems([])
      },
    }),
    [items],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart لازم يتستخدم جوه CartProvider')
  return ctx
}
