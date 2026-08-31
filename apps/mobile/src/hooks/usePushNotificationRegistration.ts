import { authApi } from '@elhazem/shared'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { isDemoMode } from '../lib/supabaseClient'

// تسجيل جهاز الموبايل لاستقبال إشعارات Push (تحديثات حالة الطلب، طلب توصيلة جديدة للمندوب...)
// وحفظ الـ Expo push token في profiles.expo_push_token عن طريق authApi.updateProfile.
export function usePushNotificationRegistration() {
  const { client, profile } = useAuth()

  useEffect(() => {
    if (isDemoMode) return
    if (!profile) return
    // السيميوليتور/الإيموليتور ومعاينة الويب مش بيدعموا push tokens حقيقية
    if (Platform.OS === 'web' || !Device.isDevice) return

    let cancelled = false

    async function register() {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync()
        let finalStatus = existingStatus
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync()
          finalStatus = status
        }
        if (finalStatus !== 'granted') return

        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'الافتراضي',
            importance: Notifications.AndroidImportance.DEFAULT,
          })
        }

        const projectId = Constants.expoConfig?.extra?.eas?.projectId
        const tokenResponse = await Notifications.getExpoPushTokenAsync(
          projectId && projectId !== 'REPLACE_WITH_EAS_PROJECT_ID' ? { projectId } : undefined,
        )
        const token = tokenResponse.data

        if (!cancelled && profile && token && token !== profile.expoPushToken) {
          await authApi.updateProfile(client, profile.id, { expoPushToken: token })
        }
      } catch (error) {
        // مش بنعتبرها خطأ حرج — التطبيق يشتغل عادي من غير push، بس بنسجل تحذير للمطورين
        console.warn('فشل تسجيل push token', error)
      }
    }

    register()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])
}
