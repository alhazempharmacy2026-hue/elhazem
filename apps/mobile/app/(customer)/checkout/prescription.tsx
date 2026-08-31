import { prescriptionsApi } from '@elhazem/shared'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../../src/components/Button'
import { ScreenContainer } from '../../../src/components/ScreenContainer'
import { useAuth } from '../../../src/context/AuthContext'
import { useCheckout } from '../../../src/context/CheckoutContext'
import { isDemoMode } from '../../../src/lib/supabaseClient'
import { colors, fonts, fontSize, radius, spacing } from '../../../src/lib/theme'

export default function PrescriptionStepScreen() {
  const { client, profile } = useAuth()
  const { prescriptionId, setPrescriptionId } = useCheckout()

  const [localUri, setLocalUri] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pickAndUpload(source: 'camera' | 'library') {
    setError(null)
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      setError('محتاجين إذن الوصول عشان تقدر ترفع صورة الروشتة')
      return
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true, mediaTypes: ImagePicker.MediaTypeOptions.Images })

    if (result.canceled || !result.assets?.[0]) return
    if (!isDemoMode && !profile) return

    const asset = result.assets[0]
    setLocalUri(asset.uri)
    setUploading(true)
    try {
      if (isDemoMode) {
        setPrescriptionId('demo-prescription')
        return
      }
      // لازم نحوّل الـ local URI لـ Blob فعلي قبل ما نبعته لـ prescriptionsApi (متطلب موضح
      // في تعليق الدالة نفسها جوه packages/shared/src/api/prescriptions.ts)
      const blob = await (await fetch(asset.uri)).blob()
      const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase()
      const prescription = await prescriptionsApi.uploadPrescriptionImage(client, profile!.id, blob, ext)
      setPrescriptionId(prescription.id)
    } catch (err) {
      setError('فشل رفع صورة الروشتة، حاول تاني')
      console.warn(err)
      setLocalUri(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <ScreenContainer>
      <Text style={styles.title}>صورة الروشتة الطبية</Text>
      <Text style={styles.subtitle}>طلبك فيه دواء بيحتاج روشتة — ارفع صورة واضحة عشان الصيدلي يراجعها</Text>

      {localUri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: localUri }} style={styles.preview} resizeMode="contain" />
          {uploading ? <ActivityIndicator style={styles.previewLoader} color={colors.brand} /> : null}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.actions}>
        <Button title="التقاط صورة بالكاميرا" onPress={() => pickAndUpload('camera')} variant="secondary" disabled={uploading} />
        <Button title="اختيار من المعرض" onPress={() => pickAndUpload('library')} variant="secondary" disabled={uploading} />
      </View>

      <Button
        title="متابعة"
        onPress={() => router.push('/(customer)/checkout/payment')}
        disabled={!prescriptionId || uploading}
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.text, textAlign: 'right' },
  subtitle: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'right' },
  previewWrap: { position: 'relative' },
  preview: { width: '100%', height: 220, borderRadius: radius.lg, backgroundColor: colors.surface },
  previewLoader: { position: 'absolute', top: '45%', alignSelf: 'center' },
  error: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.danger, textAlign: 'right' },
  actions: { gap: spacing.md },
})
