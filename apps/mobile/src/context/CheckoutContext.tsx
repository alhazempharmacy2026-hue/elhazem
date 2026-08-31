import type { PaymentMethod } from '@elhazem/shared'
import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react'

// حالة مؤقتة بتتنقل بين شاشات إتمام الطلب (العنوان ← الروشتة ← طريقة الدفع ← المراجعة)
// قبل ما تتحول لطلب فعلي عن طريق ordersApi.placeOrder
interface CheckoutState {
  addressId: string | null
  prescriptionId: string | null
  paymentMethod: PaymentMethod | null
  notes: string
}

interface CheckoutContextValue extends CheckoutState {
  setAddressId: (id: string | null) => void
  setPrescriptionId: (id: string | null) => void
  setPaymentMethod: (method: PaymentMethod | null) => void
  setNotes: (notes: string) => void
  reset: () => void
}

const initialState: CheckoutState = {
  addressId: null,
  prescriptionId: null,
  paymentMethod: null,
  notes: '',
}

const CheckoutContext = createContext<CheckoutContextValue | null>(null)

export function CheckoutProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<CheckoutState>(initialState)

  const value = useMemo<CheckoutContextValue>(
    () => ({
      ...state,
      setAddressId: (addressId) => setState((prev) => ({ ...prev, addressId })),
      setPrescriptionId: (prescriptionId) => setState((prev) => ({ ...prev, prescriptionId })),
      setPaymentMethod: (paymentMethod) => setState((prev) => ({ ...prev, paymentMethod })),
      setNotes: (notes) => setState((prev) => ({ ...prev, notes })),
      reset: () => setState(initialState),
    }),
    [state],
  )

  return <CheckoutContext.Provider value={value}>{children}</CheckoutContext.Provider>
}

export function useCheckout(): CheckoutContextValue {
  const ctx = useContext(CheckoutContext)
  if (!ctx) throw new Error('useCheckout لازم يتستخدم جوه CheckoutProvider')
  return ctx
}
