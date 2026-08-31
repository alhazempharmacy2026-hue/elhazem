import { authApi, roleLabels } from '@elhazem/shared'
import { router } from 'expo-router'
import { useState, type ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { colors, fonts, fontSize, spacing } from '../lib/theme'
import { Button } from './Button'
import { Card } from './Card'
import { TextField } from './TextField'

// شاشة الحساب مشتركة بين وضع العميل ووضع المندوب — نفس منطق تعديل البيانات وتسجيل الخروج،
// كل وضع بيقدر يضيف محتوى إضافي خاص بيه عن طريق children
export function AccountView({ children }: { children?: ReactNode }) {
  const { client, profile, signOut } = useAuth()
  const [fullName, setFullName] = useState(profile?.fullName ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  if (!profile) return null

  async function handleSave() {
    setSaving(true)
    setSavedMessage(null)
    try {
      await authApi.updateProfile(client, profile!.id, { fullName, phone })
      setSavedMessage('تم حفظ التعديلات')
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : 'فشل حفظ التعديلات')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      router.replace('/auth/sign-in')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <View style={styles.wrapper}>
      <Card>
        <View style={styles.roleRow}>
          <Text style={styles.roleBadgeText}>{roleLabels[profile.role]}</Text>
        </View>
        <TextField label="الاسم بالكامل" value={fullName} onChangeText={setFullName} />
        <TextField label="رقم الموبايل" value={phone ?? ''} onChangeText={setPhone} keyboardType="phone-pad" />
        {savedMessage ? <Text style={styles.saved}>{savedMessage}</Text> : null}
        <Button title="حفظ التعديلات" onPress={handleSave} loading={saving} />
      </Card>

      {children}

      <Button title="تسجيل الخروج" variant="danger" onPress={handleSignOut} loading={signingOut} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.md },
  roleRow: { alignItems: 'flex-end', marginBottom: spacing.sm },
  roleBadgeText: { fontFamily: fonts.medium, fontSize: fontSize.xs, color: colors.brandDark },
  saved: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.brandDark, textAlign: 'right' },
})
