import { formatCurrency } from '@elhazem/shared'
import { router } from 'expo-router'
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../../src/components/Button'
import { EmptyState } from '../../../src/components/EmptyState'
import { QuantityStepper } from '../../../src/components/QuantityStepper'
import { ScreenContainer } from '../../../src/components/ScreenContainer'
import { useCart } from '../../../src/context/CartContext'
import { colors, fonts, fontSize, radius, spacing } from '../../../src/lib/theme'

export default function CartScreen() {
  const { items, subtotal, total, requiresPrescription, setQuantity, removeFromCart } = useCart()

  if (items.length === 0) {
    return (
      <ScreenContainer>
        <EmptyState title="عربتك فاضية" subtitle="تصفح الأدوية وأضف اللي محتاجه" />
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer scroll={false}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.medicineId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {item.medicine.imageUrl ? (
              <Image source={{ uri: item.medicine.imageUrl }} style={styles.thumb} resizeMode="contain" />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Text style={{ fontSize: 22 }}>💊</Text>
              </View>
            )}
            <View style={styles.rowInfo}>
              <Text style={styles.name} numberOfLines={2}>
                {item.medicine.nameAr}
              </Text>
              <Text style={styles.linePrice}>{formatCurrency(item.medicine.price * item.quantity)}</Text>
              <View style={styles.rowActions}>
                <QuantityStepper
                  quantity={item.quantity}
                  onChange={(next) => setQuantity(item.medicineId, next)}
                  min={0}
                  max={item.medicine.stockQuantity}
                />
                <Pressable onPress={() => removeFromCart(item.medicineId)}>
                  <Text style={styles.remove}>حذف</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.summary}>
        {requiresPrescription ? (
          <Text style={styles.rxNotice}>يحتوي طلبك على دواء يحتاج صورة روشتة طبية</Text>
        ) : null}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>الإجمالي الفرعي</Text>
          <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>رسوم التوصيل والإجمالي يتحددوا في المراجعة النهائية</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>الإجمالي التقديري</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
        <Button title="متابعة إتمام الطلب" onPress={() => router.push('/(customer)/checkout/address')} />
      </View>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  listContent: { padding: spacing.lg, gap: spacing.md },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  thumb: { width: 64, height: 64, borderRadius: radius.sm, backgroundColor: colors.background },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, gap: spacing.xs },
  name: { fontFamily: fonts.semiBold, fontSize: fontSize.sm, color: colors.text, textAlign: 'right' },
  linePrice: { fontFamily: fonts.bold, fontSize: fontSize.sm, color: colors.brandDark, textAlign: 'right' },
  rowActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  remove: { fontFamily: fonts.medium, fontSize: fontSize.xs, color: colors.danger },
  summary: {
    padding: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rxNotice: {
    fontFamily: fonts.medium,
    fontSize: fontSize.xs,
    color: colors.warning,
    textAlign: 'right',
    marginBottom: spacing.xs,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'right' },
  summaryValue: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.text },
  totalLabel: { fontFamily: fonts.semiBold, fontSize: fontSize.md, color: colors.text },
  totalValue: { fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.brandDark },
})
