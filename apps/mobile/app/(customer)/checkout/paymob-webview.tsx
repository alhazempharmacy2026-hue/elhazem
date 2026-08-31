import { useLocalSearchParams, useNavigation, router } from 'expo-router'
import { useLayoutEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import WebView, { type WebViewNavigation } from 'react-native-webview'
import { LoadingScreen } from '../../../src/components/LoadingScreen'
import { colors } from '../../../src/lib/theme'

// صفحة دفع Paymob بتفتح جوه WebView (باي موب مفيهوش SDK رسمي لـ React Native)، وبعد ما
// العميل يكمل الدفع، باي موب بيعمل redirect لرابط الـ callback بتاعنا. عرّفنا الـ scheme
// "elhazem://" في app.config.ts عشان نقدر نلتقط الرجوع ده جوه WebView ونكمل التطبيق طبيعي.
export default function PaymobWebViewScreen() {
  const { orderId, checkoutUrl } = useLocalSearchParams<{ orderId: string; checkoutUrl: string }>()
  const navigation = useNavigation()

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'إتمام الدفع' })
  }, [navigation])

  function handleNavigationStateChange(event: WebViewNavigation) {
    // أي تحويل لسكيم التطبيق نفسه (سواء نجح الدفع أو فشل) معناه إن باي موب خلص ورجعنا —
    // حالة الدفع الحقيقية هتوصل لاحقًا (أو وصلت خلاص) عن طريق webhook + Realtime على جدول orders،
    // فشاشة التتبع هي مصدر الحقيقة النهائي مش الـ redirect نفسه.
    if (event.url.startsWith('elhazem://')) {
      router.replace(`/(customer)/order/${orderId}/tracking`)
    }
  }

  if (!checkoutUrl) return <LoadingScreen />

  return (
    <View style={styles.flex}>
      <WebView
        source={{ uri: checkoutUrl }}
        onNavigationStateChange={handleNavigationStateChange}
        startInLoadingState
        renderLoading={() => <LoadingScreen message="جاري تحميل صفحة الدفع..." />}
        style={styles.flex}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
})
