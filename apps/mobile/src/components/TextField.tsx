import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { colors, fonts, fontSize, radius, spacing } from '../lib/theme'

interface TextFieldProps extends TextInputProps {
  label?: string
  error?: string | null
}

export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.textMuted}
        textAlign="right"
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.text, textAlign: 'right' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
    writingDirection: 'rtl',
  },
  inputError: { borderColor: colors.danger },
  error: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.danger, textAlign: 'right' },
})
