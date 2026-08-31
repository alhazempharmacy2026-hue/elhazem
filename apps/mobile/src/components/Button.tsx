import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { colors, fonts, fontSize, radius, spacing } from '../lib/theme'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: Variant
  disabled?: boolean
  loading?: boolean
}

export function Button({ title, onPress, variant = 'primary', disabled, loading }: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? colors.brand : colors.white} />
      ) : (
        <Text style={[styles.text, textVariantStyles[variant]]}>{title}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: { fontFamily: fonts.semiBold, fontSize: fontSize.md },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
})

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: colors.brand },
  secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: 'transparent' },
})

const textVariantStyles = StyleSheet.create({
  primary: { color: colors.white },
  secondary: { color: colors.text },
  danger: { color: colors.white },
  ghost: { color: colors.brand },
})
