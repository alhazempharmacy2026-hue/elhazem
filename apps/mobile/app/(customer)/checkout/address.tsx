import { addressesApi, addressSchema, cartRequiresPrescription, type Address } from '@elhazem/shared'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../../src/components/Button'
import { Card } from '../../../src/components/Card'
import { EmptyState } from '../../../src/components/EmptyState'
import { LoadingScreen } from '../../../src/components/LoadingScreen'
import { ScreenContainer } from '../../../src/components/ScreenContainer'
import { TextField } from '../../../src/components/TextField'
import { useAuth } from '../../../src/context/AuthContext'
import { useCart } from '../../../src/context/CartContext'
import { useCheckout } from '../../../src/context/CheckoutContext'
import { demoAddress } from '../../../src/lib/demoData'
import { isDemoMode } from '../../../src/lib/supabaseClient'
import { colors, fonts, fontSize, spacing } from '../../../src/lib/theme'

export default function AddressStepScreen() {
  const { client, profile } = useAuth()
  const { items } = useCart()
  const { addressId, setAddressId } = useCheckout()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const [form, setForm] = useState({
    label: '',
    governorate: '',
    city: '',
    street: '',
    building: '',
    floor: '',
    apartment: '',
    landmark: '',
  })

  useEffect(() => {
    if (isDemoMode) {
      setAddresses([demoAddress])
      setAddressId(demoAddress.id)
      setShowForm(false)
      setLoading(false)
      return
    }
    if (!profile) return
    addressesApi
      .listAddresses(client, profile.id)
      .then((list) => {
        setAddresses(list)
        if (!addressId) {
          const preferred = list.find((a) => a.isDefault) ?? list[0]
          if (preferred) setAddressId(preferred.id)
        }
        setShowForm(list.length === 0)
      })
      .catch((err) => console.warn('فشل تحميل العناوين', err))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  async function handleSaveAddress() {
    if (!profile) return
    setFormError(null)
    const parsed = addressSchema.safeParse({
      ...form,
      floor: form.floor || undefined,
      apartment: form.apartment || undefined,
      landmark: form.landmark || undefined,
      lat: null,
      lng: null,
      isDefault: addresses.length === 0,
    })
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] = issue.message
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setSaving(true)
    try {
      const created = await addressesApi.createAddress(client, profile.id, {
        ...parsed.data,
        floor: parsed.data.floor ?? null,
        apartment: parsed.data.apartment ?? null,
        landmark: parsed.data.landmark ?? null,
        lat: null,
        lng: null,
        isDefault: parsed.data.isDefault ?? false,
      })
      setAddresses((prev) => [...prev, created])
      setAddressId(created.id)
      setShowForm(false)
      setForm({ label: '', governorate: '', city: '', street: '', building: '', floor: '', apartment: '', landmark: '' })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'فشل حفظ العنوان')
    } finally {
      setSaving(false)
    }
  }

  function handleContinue() {
    if (!addressId) return
    if (cartRequiresPrescription(items)) {
      router.push('/(customer)/checkout/prescription')
    } else {
      router.push('/(customer)/checkout/payment')
    }
  }

  if (loading) return <LoadingScreen />

  return (
    <ScreenContainer>
      <Text style={styles.sectionTitle}>اختار عنوان التوصيل</Text>

      {addresses.length === 0 && !showForm ? (
        <EmptyState title="مفيش عناوين محفوظة" subtitle="أضف عنوان جديد للمتابعة" />
      ) : (
        addresses.map((address) => (
          <Pressable key={address.id} onPress={() => setAddressId(address.id)}>
            <Card style={address.id === addressId ? styles.cardSelected : undefined}>
              <View style={styles.addressHeader}>
                <Text style={styles.addressLabel}>{address.label}</Text>
                {address.id === addressId ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
              <Text style={styles.addressLine}>
                {address.governorate} - {address.city} - {address.street} - عمارة {address.building}
                {address.floor ? ` - الدور ${address.floor}` : ''}
                {address.apartment ? ` - شقة ${address.apartment}` : ''}
              </Text>
              {address.landmark ? <Text style={styles.addressLandmark}>علامة مميزة: {address.landmark}</Text> : null}
            </Card>
          </Pressable>
        ))
      )}

      {showForm ? (
        <Card style={styles.formCard}>
          <TextField label="اسم العنوان (مثلاً: المنزل)" value={form.label} onChangeText={(v) => setForm((f) => ({ ...f, label: v }))} error={errors.label} />
          <TextField label="المحافظة" value={form.governorate} onChangeText={(v) => setForm((f) => ({ ...f, governorate: v }))} error={errors.governorate} />
          <TextField label="المدينة/المركز" value={form.city} onChangeText={(v) => setForm((f) => ({ ...f, city: v }))} error={errors.city} />
          <TextField label="الشارع" value={form.street} onChangeText={(v) => setForm((f) => ({ ...f, street: v }))} error={errors.street} />
          <TextField label="رقم العمارة" value={form.building} onChangeText={(v) => setForm((f) => ({ ...f, building: v }))} error={errors.building} />
          <TextField label="الدور (اختياري)" value={form.floor} onChangeText={(v) => setForm((f) => ({ ...f, floor: v }))} />
          <TextField label="رقم الشقة (اختياري)" value={form.apartment} onChangeText={(v) => setForm((f) => ({ ...f, apartment: v }))} />
          <TextField label="علامة مميزة (اختياري)" value={form.landmark} onChangeText={(v) => setForm((f) => ({ ...f, landmark: v }))} />
          {formError ? <Text style={styles.formError}>{formError}</Text> : null}
          <Button title="حفظ العنوان" onPress={handleSaveAddress} loading={saving} />
        </Card>
      ) : !isDemoMode ? (
        <Button title="+ إضافة عنوان جديد" variant="secondary" onPress={() => setShowForm(true)} />
      ) : null}

      <Button title="متابعة" onPress={handleContinue} disabled={!addressId} />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  sectionTitle: { fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.text, textAlign: 'right' },
  cardSelected: { borderColor: colors.brand, borderWidth: 2 },
  addressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addressLabel: { fontFamily: fonts.semiBold, fontSize: fontSize.md, color: colors.text },
  checkMark: { color: colors.brand, fontFamily: fonts.bold, fontSize: fontSize.md },
  addressLine: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs },
  addressLandmark: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs },
  formCard: { gap: spacing.md },
  formError: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.danger, textAlign: 'right' },
})
