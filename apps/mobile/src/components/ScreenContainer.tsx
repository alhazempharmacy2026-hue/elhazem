import type { PropsWithChildren } from 'react'
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing } from '../lib/theme'

interface ScreenContainerProps extends PropsWithChildren {
  scroll?: boolean
  style?: ViewStyle
  contentStyle?: ViewStyle
}

// حاوية أساسية لكل الشاشات: خلفية موحدة + احترام مناطق الأمان (safe area) + خيار تمرير (scroll)
export function ScreenContainer({ children, scroll = true, style, contentStyle }: ScreenContainerProps) {
  const Inner = scroll ? ScrollView : View
  return (
    <SafeAreaView style={[styles.safe, style]} edges={['top', 'left', 'right']}>
      <Inner
        style={styles.flex}
        contentContainerStyle={scroll ? [styles.content, contentStyle] : undefined}
        {...(scroll ? { keyboardShouldPersistTaps: 'handled' as const, showsVerticalScrollIndicator: false } : {})}
      >
        {!scroll ? <View style={[styles.content, styles.flex, contentStyle]}>{children}</View> : children}
      </Inner>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
})
