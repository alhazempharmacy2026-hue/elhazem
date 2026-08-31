import { Stack } from 'expo-router'
import { colors, fonts, fontSize } from '../../src/lib/theme'

export default function AuthLayout() {
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
      <Stack.Screen name="sign-in" options={{ title: 'تسجيل الدخول' }} />
      <Stack.Screen name="sign-up" options={{ title: 'حساب جديد' }} />
    </Stack>
  )
}
