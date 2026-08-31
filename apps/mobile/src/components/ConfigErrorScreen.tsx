import { StyleSheet, Text, View } from 'react-native'
import { colors, fonts, fontSize, spacing } from '../lib/theme'

// شاشة توضيحية تظهر بدل ما التطبيق يعمل crash لو مفاتيح Supabase مش موجودة في .env
export function ConfigErrorScreen({ message }: { message: string }) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>التطبيق يحتاج إعداد</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
    gap: spacing.md,
  },
  icon: { fontSize: 40 },
  title: { fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.text },
  message: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
})
