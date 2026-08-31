import {
  DEFAULT_DELIVERY_FEE,
  formatCurrency,
  ordersApi,
  paymentMethodLabels,
  paymentsApi,
} from '@elhazem/shared'
import { router } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Button } from '../../../src/components/Button'
import { Card } from '../../../src/components/Card'
import { ScreenContainer } from '../../../src/components/ScreenContainer'
import { useAuth } from '../../../src/context/AuthContext'
import { useCart } from '../../../src/context/CartContext'
import { useCheckout } from '../../../src/context/CheckoutContext'
import { placeDemoOrder } from '../../../src/lib/demoStore'
import { isDemoMode } from '../../../src/lib/supabaseClient'
import { colors, fonts, fontSize, spacing } from '../../../src/lib/theme'

export default function ReviewStepScreen() {
  const { client } = useAuth()
  const { items, subtotal, clearCart } = useCart()
  const { addressId, prescriptionId, paymentMethod, notes, reset } = useCheckout()

  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = subtotal + DEFAULT_DELIVERY_FEE

  async function handlePlaceOrder() {
    if (!addressId || !paymentMethod || items.length === 0) return
    setError(null)
    setPlacing(true)
    try {
      if (isDemoMode) {
        // في الوضع التجريبي بنتخطى Paymob بالكامل ونعتبر أي طلب "اتدفع" فورًا
        const order = placeDemoOrder(items, paymentMethod)
        clearCart()
        reset()
        router.replace(`/(customer)/order/${order.id}/tracking`)
        return
      }

      const order = await ordersApi.placeOrder(client, {
        addressId,
        paymentMethod,
        items,
        prescriptionId: prescriptionId ?? null,
        notes: notes || null,
      })

      if (paymentMethod === 'paymob_card' || paymentMethod === 'paymob_wallet') {
        const intention = await paymentsApi.createPaymentIntention(client, order.id, paymentMethod)
        clearCart()
        reset()
        router.replace({
          pathname: '/(customer)/checkout/paymob-webview',
          params: { orderId: order.id, checkoutUrl: intention.checkoutUrl },
        })
        return
      }

      // الدفع عند الاستلام: الطلب اتسجل خلاص، نفضي العربة ونروح لشاشة التتبع
      clearCart()
      reset()
      router.replace(`/(customer)/order/${order.id}/tracking`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إتمام الطلب، حاول تاني')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>مراجعة الطلب</Text>

      <Card>
        {items.map((item) => (
          <View key={item.medicineId} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.medicine.nameAr} × {item.quantity}
            </Text>
            <Text style={styles.itemPrice}>{formatCurrency(item.medicine.price * item.quantity)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.itemRow}>
          <Text style={styles.summaryLabel}>الإجمالي الفرعي</Text>
          <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.summaryLabel}>رسوم التوصيل</Text>
          <Text style={styles.summaryValue}>{formatCurrency(DEFAULT_DELIVERY_FEE)}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.totalLabel}>الإجمالي</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
      </Card>

      <Card>
        <Text style={styles.rowLabel}>طريقة الدفع</Text>
        <Text style={styles.rowValue}>{paymentMethod ? paymentMethodLabels[paymentMethod] : '—'}</Text>
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        title="تأكيد وإرسال الطلب"
        onPress={handlePlaceOrder}
        loading={placing}
        disabled={!addressId || !paymentMethod || items.length === 0}
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.text, textAlign: 'right' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  itemName: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.text, flexShrink: 1 },
  itemPrice: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  summaryLabel: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },
  summaryValue: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.text },
  totalLabel: { fontFamily: fonts.semiBold, fontSize: fontSize.md, color: colors.text },
  totalValue: { fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.brandDark },
  rowLabel: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'right' },
  rowValue: { fontFamily: fonts.semiBold, fontSize: fontSize.md, color: colors.text, textAlign: 'right', marginTop: spacing.xs },
  error: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.danger, textAlign: 'right' },
})
