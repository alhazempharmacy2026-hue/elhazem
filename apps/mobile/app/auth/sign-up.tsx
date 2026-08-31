import { signUpSchema } from '@elhazem/shared'
import { router } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { Button } from '../../src/components/Button'
import { ScreenContainer } from '../../src/components/ScreenContainer'
import { TextField } from '../../src/components/TextField'
import { useAuth } from '../../src/context/AuthContext'
import { colors, fonts, fontSize, spacing } from '../../src/lib/theme'

export default function SignUpScreen() {
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setFormError(null)
    setInfo(null)
    const parsed = signUpSchema.safeParse({ fullName, email, password, phone })
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await signUp(parsed.data)
      // حسب إعدادات مشروع Supabase، ممكن يتطلب تأكيد الإيميل قبل ما جلسة تتفتح تلقائيًا —
      // في الحالة دي بنوجه المستخدم لشاشة تسجيل الدخول بعد ما يأكد إيميله.
      setInfo('تم إنشاء الحساب. لو طُلب منك تأكيد بريدك الإلكتروني، تأكد منه ثم سجّل دخولك.')
      setTimeout(() => router.replace('/'), 1200)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'فشل إنشاء الحساب، حاول تاني')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>إنشاء حساب جديد</Text>
      <Text style={styles.subtitle}>سجّل بياناتك عشان تقدر تطلب من صيدلية الحازم</Text>

      <TextField label="الاسم بالكامل" value={fullName} onChangeText={setFullName} error={errors.fullName} />
      <TextField
        label="البريد الإلكتروني"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        error={errors.email}
      />
      <TextField
        label="رقم الموبايل"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="01xxxxxxxxx"
        error={errors.phone}
      />
      <TextField label="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} />

      {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      {info ? <Text style={styles.info}>{info}</Text> : null}

      <Button title="إنشاء الحساب" onPress={handleSubmit} loading={loading} />
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
  info: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.brandDark, textAlign: 'right' },
})
