import { catalogApi, formatCurrency, type Medicine } from '@elhazem/shared'
import { useLocalSearchParams, useNavigation } from 'expo-router'
import { useEffect, useLayoutEffect, useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../../src/components/Button'
import { LoadingScreen } from '../../../src/components/LoadingScreen'
import { ScreenContainer } from '../../../src/components/ScreenContainer'
import { QuantityStepper } from '../../../src/components/QuantityStepper'
import { useAuth } from '../../../src/context/AuthContext'
import { useCart } from '../../../src/context/CartContext'
import { colors, fonts, fontSize, radius, spacing } from '../../../src/lib/theme'

export default function MedicineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { client } = useAuth()
  const { addToCart } = useCart()
  const navigation = useNavigation()

  const [medicine, setMedicine] = useState<Medicine | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!id) return
    catalogApi
      .getMedicine(client, id)
      .then(setMedicine)
      .catch((err) => console.warn('فشل تحميل الدواء', err))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useLayoutEffect(() => {
    if (medicine) navigation.setOptions({ title: medicine.nameAr })
  }, [medicine, navigation])

  if (loading) return <LoadingScreen />
  if (!medicine) {
    return (
      <ScreenContainer>
        <Text style={styles.notFound}>الدواء غير موجود</Text>
      </ScreenContainer>
    )
  }

  const outOfStock = medicine.stockQuantity <= 0

  return (
    <ScreenContainer>
      {medicine.imageUrl ? (
        <Image source={{ uri: medicine.imageUrl }} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={{ fontSize: 56 }}>💊</Text>
        </View>
      )}

      <Text style={styles.name}>{medicine.nameAr}</Text>
      {medicine.manufacturer ? <Text style={styles.manufacturer}>{medicine.manufacturer}</Text> : null}
      <Text style={styles.price}>{formatCurrency(medicine.price)}</Text>

      {medicine.requiresPrescription ? (
        <View style={styles.rxNotice}>
          <Text style={styles.rxNoticeText}>هذا الدواء يحتاج صورة روشتة طبية عند إتمام الطلب</Text>
        </View>
      ) : null}

      {medicine.descriptionAr ? <Text style={styles.description}>{medicine.descriptionAr}</Text> : null}

      {outOfStock ? (
        <Text style={styles.outOfStock}>الدواء غير متوفر حاليًا في المخزون</Text>
      ) : (
        <View style={styles.actions}>
          <QuantityStepper quantity={quantity} onChange={setQuantity} min={1} max={medicine.stockQuantity} />
          <Button
            title={added ? 'تمت الإضافة ✓' : 'أضف للعربة'}
            onPress={() => {
              addToCart(medicine, quantity)
              setAdded(true)
              setTimeout(() => setAdded(false), 1500)
            }}
          />
        </View>
      )}
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  image: { width: '100%', height: 220, borderRadius: radius.lg, backgroundColor: colors.surface },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.bold, fontSize: fontSize.xl, color: colors.text, textAlign: 'right' },
  manufacturer: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'right' },
  price: { fontFamily: fonts.bold, fontSize: fontSize.xl, color: colors.brandDark, textAlign: 'right' },
  rxNotice: {
    backgroundColor: `${colors.warning}1a`,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  rxNoticeText: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.warning, textAlign: 'right' },
  description: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.text, textAlign: 'right', lineHeight: 22 },
  outOfStock: { fontFamily: fonts.semiBold, fontSize: fontSize.md, color: colors.danger, textAlign: 'right' },
  actions: { gap: spacing.md, marginTop: spacing.sm },
  notFound: { fontFamily: fonts.medium, fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' },
})
