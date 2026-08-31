import { Stack } from 'expo-router'
import { CheckoutProvider } from '../../src/context/CheckoutContext'
import { usePushNotificationRegistration } from '../../src/hooks/usePushNotificationRegistration'
import { colors, fonts, fontSize } from '../../src/lib/theme'

export default function CustomerLayout() {
  usePushNotificationRegistration()

  return (
    <CheckoutProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fonts.semiBold, fontSize: fontSize.md },
          headerShadowVisible: false,
          headerBackTitle: '',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="medicine/[id]" options={{ title: 'تفاصيل الدواء' }} />
        <Stack.Screen name="checkout/address" options={{ title: 'عنوان التوصيل' }} />
        <Stack.Screen name="checkout/prescription" options={{ title: 'صورة الروشتة' }} />
        <Stack.Screen name="checkout/payment" options={{ title: 'طريقة الدفع' }} />
        <Stack.Screen name="checkout/review" options={{ title: 'مراجعة الطلب' }} />
        <Stack.Screen name="checkout/paymob-webview" options={{ title: 'إتمام الدفع' }} />
        <Stack.Screen name="order/[id]/tracking" options={{ title: 'تتبع الطلب' }} />
      </Stack>
    </CheckoutProvider>
  )
}
