import type { PropsWithChildren } from 'react'
import { ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { isDemoMode } from '../lib/supabaseClient'
import { colors, fonts, fontSize, spacing } from '../lib/theme'

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
      {isDemoMode ? (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>وضع تجريبي — بيانات وهمية محفوظة على جهازك بس</Text>
        </View>
      ) : null}
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
  demoBanner: { backgroundColor: colors.warning, paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  demoBannerText: { fontFamily: fonts.medium, fontSize: fontSize.xs, color: colors.white, textAlign: 'center' },
})
