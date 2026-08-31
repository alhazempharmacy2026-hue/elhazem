import type { ElhazemClient } from '../supabase/createClient'

export interface PaymentIntentionResult {
  checkoutUrl: string
  paymobOrderId: string
}

// بينادي Edge Function `create-payment-intention` (مش Paymob مباشرة) — المفتاح السري لباي موب
// بيفضل على السيرفر بس، مش في كود العميل.
export async function createPaymentIntention(
  client: ElhazemClient,
  orderId: string,
  paymentMethod: 'paymob_card' | 'paymob_wallet',
): Promise<PaymentIntentionResult> {
  const { data, error } = await client.functions.invoke<PaymentIntentionResult>('create-payment-intention', {
    body: { orderId, paymentMethod },
  })
  if (error) throw error
  if (!data) throw new Error('لم يتم استلام رابط الدفع من الخادم')
  return data
}
