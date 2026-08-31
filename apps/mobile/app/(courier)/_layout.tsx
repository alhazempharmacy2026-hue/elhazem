import { Stack } from 'expo-router'
import { usePushNotificationRegistration } from '../../src/hooks/usePushNotificationRegistration'
import { colors, fonts, fontSize } from '../../src/lib/theme'

export default function CourierLayout() {
  usePushNotificationRegistration()

  return (
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
      <Stack.Screen name="order/[id]" options={{ title: 'تفاصيل التوصيلة' }} />
    </Stack>
  )
}
