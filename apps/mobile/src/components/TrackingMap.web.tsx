import { StyleSheet, Text, View } from 'react-native'
import { colors, fonts, fontSize, radius, spacing } from '../lib/theme'

// react-native-maps مالهوش دعم رسمي لمنصة الويب، فمعاينة الويب بتعرض بديل بسيط بدل الخريطة
// الحقيقية (اللي بتظهر عادي على iOS/Android). الموقع نفسه (lat/lng) حقيقي وبيتحدّث لحظيًا.
export function TrackingMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.pin}>📍</Text>
      <Text style={styles.label}>موقع المندوب الحالي</Text>
      <Text style={styles.coords}>
        {lat.toFixed(4)}, {lng.toFixed(4)}
      </Text>
      <Text style={styles.hint}>(الخريطة التفاعلية متاحة على تطبيق iOS/Android الحقيقي)</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  pin: { fontSize: 32 },
  label: { fontFamily: fonts.semiBold, fontSize: fontSize.sm, color: colors.text },
  coords: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  hint: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
})
