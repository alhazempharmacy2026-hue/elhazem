import { StyleSheet, Text, View } from 'react-native'
import { colors, fonts, fontSize, spacing } from '../lib/theme'

interface EmptyStateProps {
  title: string
  subtitle?: string
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl, gap: spacing.xs },
  title: { fontFamily: fonts.semiBold, fontSize: fontSize.md, color: colors.text, textAlign: 'center' },
  subtitle: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
})
