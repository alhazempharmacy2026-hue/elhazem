import { deliveryApi } from '@elhazem/shared'
import * as Location from 'expo-location'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const UPDATE_INTERVAL_MS = 12_000
const MIN_DISTANCE_METERS = 25

// تتبع موقع المندوب أثناء توصيلة نشطة وبعت تحديثات دورية لـ courier_locations عن طريق
// deliveryApi.upsertCourierLocation، عشان شاشة تتبع العميل (react-native-maps) تعرض
// موقعه بشكل شبه مباشر (Realtime channel).
//
// ملاحظة مهمة (نطاق النسخة الأولى - MVP): التتبع ده Foreground-only — بيشتغل بس والتطبيق
// فاتح وعلى الشاشة دي بالذات. لو المندوب سحب التطبيق للخلفية أو قفل الشاشة، هيتوقف الإرسال
// فورًا. ده قرار متعمد لتبسيط النسخة الأولى، مش عيب برمجي — تتبع الخلفية (background location)
// محتاج إعدادات وأذونات إضافية معقدة (خصوصًا على iOS) وتم تأجيله عمدًا لنسخة لاحقة.
export function useCourierLocationTracking(orderId: string, enabled: boolean) {
  const { client, profile } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null)

  useEffect(() => {
    if (!enabled || !profile) {
      subscriptionRef.current?.remove()
      subscriptionRef.current = null
      return
    }

    let cancelled = false

    async function start() {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        if (!cancelled) setError('التطبيق محتاج إذن الوصول للموقع عشان يبعت تحديثات التوصيلة للعميل.')
        return
      }

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: UPDATE_INTERVAL_MS,
          distanceInterval: MIN_DISTANCE_METERS,
        },
        (position) => {
          deliveryApi
            .upsertCourierLocation(client, profile!.id, {
              orderId,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
            .catch((uploadError) => console.warn('فشل إرسال موقع المندوب', uploadError))
        },
      )
    }

    start()

    return () => {
      cancelled = true
      subscriptionRef.current?.remove()
      subscriptionRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, orderId, profile?.id])

  return { error }
}
