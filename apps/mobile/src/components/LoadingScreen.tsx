import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { colors, fonts, fontSize, spacing } from '../lib/theme'

export function LoadingScreen({ message }: { message?: string }) {
  return (
    <View style={styles.wrapper}>
      <ActivityIndicator size="large" color={colors.brand} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, gap: spacing.md },
  message: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },
})
