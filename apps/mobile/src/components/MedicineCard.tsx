import type { Medicine } from '@elhazem/shared'
import { formatCurrency } from '@elhazem/shared'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, fontSize, radius, spacing } from '../lib/theme'

interface MedicineCardProps {
  medicine: Medicine
  onPress: () => void
}

export function MedicineCard({ medicine, onPress }: MedicineCardProps) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      {medicine.imageUrl ? (
        <Image source={{ uri: medicine.imageUrl }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.imagePlaceholderText}>💊</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {medicine.nameAr}
        </Text>
        <View style={styles.footerRow}>
          <Text style={styles.price}>{formatCurrency(medicine.price)}</Text>
          {medicine.requiresPrescription ? (
            <View style={styles.rxBadge}>
              <Text style={styles.rxBadgeText}>روشتة</Text>
            </View>
          ) : null}
        </View>
        {medicine.stockQuantity <= 0 ? <Text style={styles.outOfStock}>غير متوفر حاليًا</Text> : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  image: { width: '100%', height: 110, backgroundColor: colors.background },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { fontSize: 32 },
  info: { padding: spacing.md, gap: spacing.xs },
  name: { fontFamily: fonts.semiBold, fontSize: fontSize.sm, color: colors.text, textAlign: 'right', minHeight: 36 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price: { fontFamily: fonts.bold, fontSize: fontSize.sm, color: colors.brandDark },
  rxBadge: { backgroundColor: `${colors.warning}1a`, borderRadius: radius.sm, paddingHorizontal: spacing.xs, paddingVertical: 2 },
  rxBadgeText: { fontFamily: fonts.medium, fontSize: 10, color: colors.warning },
  outOfStock: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.danger, textAlign: 'right' },
})
