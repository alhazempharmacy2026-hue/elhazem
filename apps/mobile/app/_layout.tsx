import { I18nManager } from 'react-native'

// فرض اتجاه RTL على مستوى تحميل الموديول (قبل أي رندر) لأن التطبيق عربي بالكامل.
// تنويه مهم: React Native ما بيقدرش يقلب اتجاه التخطيط "live" في نفس الجلسة —
// التغيير ده بياخد تأثيره الكامل بعد إعادة تشغيل كاملة للتطبيق (cold restart) بس،
// وده سلوك طبيعي وموثّق في Expo/RN، مش خطأ. أول تشغيل بعد تركيب التطبيق ممكن
// يفضل شكله LTR لحد ما يتقفل ويتفتح تاني (أو بعد أول إعادة تحميل في وضع التطوير).
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true)
  I18nManager.forceRTL(true)
}

import { Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold, useFonts } from '@expo-google-fonts/cairo'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { LoadingScreen } from '../src/components/LoadingScreen'
import { AuthProvider } from '../src/context/AuthContext'
import { CartProvider } from '../src/context/CartContext'

SplashScreen.preventAutoHideAsync().catch(() => {
  // مش مشكلة لو فشل (ممكن يحصل في بعض بيئات التطوير) — التطبيق هيكمل عادي
})

export default function RootLayout() {
  const [fontsLoaded, fontsError] = useFonts({
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
  })

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [fontsLoaded, fontsError])

  if (!fontsLoaded && !fontsError) {
    return <LoadingScreen />
  }

  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="(courier)" />
        </Stack>
      </CartProvider>
    </AuthProvider>
  )
}
