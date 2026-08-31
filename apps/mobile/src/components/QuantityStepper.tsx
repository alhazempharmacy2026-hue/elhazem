import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, fontSize, radius, spacing } from '../lib/theme'

interface QuantityStepperProps {
  quantity: number
  onChange: (next: number) => void
  min?: number
  max?: number
}

export function QuantityStepper({ quantity, onChange, min = 0, max = 99 }: QuantityStepperProps) {
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.btn}
        disabled={quantity <= min}
        onPress={() => onChange(Math.max(min, quantity - 1))}
      >
        <Text style={styles.btnText}>−</Text>
      </Pressable>
      <Text style={styles.value}>{quantity}</Text>
      <Pressable
        style={styles.btn}
        disabled={quantity >= max}
        onPress={() => onChange(Math.min(max, quantity + 1))}
      >
        <Text style={styles.btnText}>+</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  btn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.brand },
  value: { fontFamily: fonts.semiBold, fontSize: fontSize.md, color: colors.text, minWidth: 24, textAlign: 'center' },
})
