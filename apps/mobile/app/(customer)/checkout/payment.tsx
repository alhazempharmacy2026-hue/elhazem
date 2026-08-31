import { paymentMethodLabels, type PaymentMethod } from '@elhazem/shared'
import { router } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../../src/components/Button'
import { Card } from '../../../src/components/Card'
import { ScreenContainer } from '../../../src/components/ScreenContainer'
import { useCheckout } from '../../../src/context/CheckoutContext'
import { colors, fonts, fontSize, spacing } from '../../../src/lib/theme'

const METHODS: { value: PaymentMethod; hint: string }[] = [
  { value: 'cash_on_delivery', hint: 'تدفع نقدًا للمندوب عند استلام طلبك' },
  { value: 'paymob_card', hint: 'دفع آمن ببطاقة الائتمان/الخصم عبر Paymob' },
  { value: 'paymob_wallet', hint: 'دفع بمحفظتك الإلكترونية عبر Paymob' },
]

export default function PaymentStepScreen() {
  const { paymentMethod, setPaymentMethod } = useCheckout()

  return (
    <ScreenContainer>
      <Text style={styles.title}>اختار طريقة الدفع</Text>

      {METHODS.map((method) => (
        <Pressable key={method.value} onPress={() => setPaymentMethod(method.value)}>
          <Card style={paymentMethod === method.value ? styles.cardSelected : undefined}>
            <View style={styles.row}>
              <Text style={styles.methodLabel}>{paymentMethodLabels[method.value]}</Text>
              {paymentMethod === method.value ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <Text style={styles.hint}>{method.hint}</Text>
          </Card>
        </Pressable>
      ))}

      <Button
        title="متابعة للمراجعة"
        onPress={() => router.push('/(customer)/checkout/review')}
        disabled={!paymentMethod}
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.text, textAlign: 'right' },
  cardSelected: { borderColor: colors.brand, borderWidth: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  methodLabel: { fontFamily: fonts.semiBold, fontSize: fontSize.md, color: colors.text },
  checkMark: { color: colors.brand, fontFamily: fonts.bold, fontSize: fontSize.md },
  hint: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs },
})
