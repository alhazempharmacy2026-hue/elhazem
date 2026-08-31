import { signInSchema } from '@elhazem/shared'
import { Link, router } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { Button } from '../../src/components/Button'
import { ScreenContainer } from '../../src/components/ScreenContainer'
import { TextField } from '../../src/components/TextField'
import { useAuth } from '../../src/context/AuthContext'
import { isDemoMode } from '../../src/lib/supabaseClient'
import { colors, fonts, fontSize, spacing } from '../../src/lib/theme'

export default function SignInScreen() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (isDemoMode) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>وضع تجريبي</Text>
        <Text style={styles.subtitle}>
          التطبيق شغال دلوقتي ببيانات وهمية بدون Supabase — انت مسجل دخول تلقائيًا كـ"عميل تجريبي".
        </Text>
        <Button title="الرجوع للتطبيق" onPress={() => router.replace('/')} />
      </ScreenContainer>
    )
  }

  async function handleSubmit() {
    setFormError(null)
    const parsed = signInSchema.safeParse({ email, password })
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await signIn(parsed.data.email, parsed.data.password)
      router.replace('/')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'فشل تسجيل الدخول، تأكد من البيانات وحاول تاني')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>مرحبًا بعودتك</Text>
      <Text style={styles.subtitle}>سجّل دخولك للمتابعة في صيدلية الحازم</Text>

      <TextField
        label="البريد الإلكتروني"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="example@email.com"
        error={errors.email}
      />
      <TextField
        label="كلمة المرور"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password}
      />
      {formError ? <Text style={styles.formError}>{formError}</Text> : null}

      <Button title="تسجيل الدخول" onPress={handleSubmit} loading={loading} />

      <Link href="/auth/sign-up" style={styles.link}>
        <Text style={styles.linkText}>مستخدم جديد؟ أنشئ حساب</Text>
      </Link>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: fontSize.xl, color: colors.text, textAlign: 'right' },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  formError: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.danger, textAlign: 'right' },
  link: { alignSelf: 'center', marginTop: spacing.md },
  linkText: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.brand },
})
