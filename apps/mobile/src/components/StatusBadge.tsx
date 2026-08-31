import { StyleSheet, Text, View } from 'react-native'
import { colors, fonts, fontSize, radius, spacing, statusColors } from '../lib/theme'

interface StatusBadgeProps {
  label: string
  statusKey: string
}

export function StatusBadge({ label, statusKey }: StatusBadgeProps) {
  const tint = statusColors[statusKey] ?? colors.brand
  return (
    <View style={[styles.badge, { backgroundColor: `${tint}1a`, borderColor: tint }]}>
      <Text style={[styles.text, { color: tint }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  text: { fontFamily: fonts.semiBold, fontSize: fontSize.xs },
})
