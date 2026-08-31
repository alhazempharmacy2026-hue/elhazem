import {
  deliveryApi,
  formatCurrency,
  formatOrderNumber,
  ordersApi,
  orderStatusLabels,
  ORDER_STATUS_TIMELINE,
  orderTimelineIndex,
  type CourierLocation,
  type Order,
  type OrderItem,
} from '@elhazem/shared'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import MapView, { Marker } from 'react-native-maps'
import { Card } from '../../../../src/components/Card'
import { LoadingScreen } from '../../../../src/components/LoadingScreen'
import { ScreenContainer } from '../../../../src/components/ScreenContainer'
import { StatusBadge } from '../../../../src/components/StatusBadge'
import { useAuth } from '../../../../src/context/AuthContext'
import { colors, fonts, fontSize, radius, spacing } from '../../../../src/lib/theme'

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { client } = useAuth()

  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [courierLocation, setCourierLocation] = useState<CourierLocation | null>(null)
  const [loading, setLoading] = useState(true)

  // تحميل أولي + الاشتراك في تحديثات الطلب اللحظية (Realtime) طول ما الشاشة مفتوحة
  useEffect(() => {
    if (!id) return
    let unsubscribeOrder: (() => void) | undefined

    Promise.all([ordersApi.getOrder(client, id), ordersApi.getOrderItems(client, id)])
      .then(([loadedOrder, loadedItems]) => {
        setOrder(loadedOrder)
        setItems(loadedItems)
      })
      .catch((err) => console.warn('فشل تحميل الطلب', err))
      .finally(() => setLoading(false))

    unsubscribeOrder = ordersApi.subscribeToOrder(client, id, setOrder)

    return () => unsubscribeOrder?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // بمجرد ما الطلب "في الطريق إليك" وفيه مندوب متعين، تابع موقعه لحظيًا على الخريطة
  useEffect(() => {
    if (!order?.courierId || order.status !== 'out_for_delivery') {
      setCourierLocation(null)
      return
    }

    let unsubscribeLocation: (() => void) | undefined
    deliveryApi
      .getCourierLocation(client, order.courierId)
      .then(setCourierLocation)
      .catch((err) => console.warn('فشل تحميل موقع المندوب', err))

    unsubscribeLocation = deliveryApi.subscribeToCourierLocation(client, order.courierId, setCourierLocation)

    return () => unsubscribeLocation?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.courierId, order?.status])

  if (loading) return <LoadingScreen />
  if (!order) {
    return (
      <ScreenContainer>
        <Text style={styles.notFound}>الطلب غير موجود</Text>
      </ScreenContainer>
    )
  }

  const timelineIndex = orderTimelineIndex(order.status)
  const isCancelledOrRejected = order.status === 'cancelled' || order.status === 'rejected'

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.orderNumber}>{formatOrderNumber(order.id)}</Text>
        <StatusBadge label={orderStatusLabels[order.status]} statusKey={order.status} />
      </View>

      {courierLocation ? (
        <View style={styles.mapWrap}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: courierLocation.lat,
              longitude: courierLocation.lng,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            region={{
              latitude: courierLocation.lat,
              longitude: courierLocation.lng,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            <Marker
              coordinate={{ latitude: courierLocation.lat, longitude: courierLocation.lng }}
              title="المندوب"
              description="موقع المندوب الحالي"
            />
          </MapView>
        </View>
      ) : null}

      {!isCancelledOrRejected ? (
        <Card>
          <Text style={styles.sectionTitle}>حالة الطلب</Text>
          {ORDER_STATUS_TIMELINE.map((status, index) => {
            const reached = timelineIndex >= 0 && index <= timelineIndex
            return (
              <View key={status} style={styles.timelineRow}>
                <View style={[styles.timelineDot, reached && styles.timelineDotActive]} />
                <Text style={[styles.timelineLabel, reached && styles.timelineLabelActive]}>
                  {orderStatusLabels[status]}
                </Text>
              </View>
            )
          })}
        </Card>
      ) : (
        <Card>
          <Text style={styles.cancelledText}>{orderStatusLabels[order.status]}</Text>
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>محتويات الطلب</Text>
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemQty}>× {item.quantity}</Text>
            <Text style={styles.itemPrice}>{formatCurrency(item.lineTotal)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.itemRow}>
          <Text style={styles.totalLabel}>الإجمالي</Text>
          <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
        </View>
      </Card>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.text },
  mapWrap: { height: 220, borderRadius: radius.lg, overflow: 'hidden' },
  map: { flex: 1 },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: fontSize.md, color: colors.text, textAlign: 'right', marginBottom: spacing.sm },
  timelineRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  timelineDotActive: { backgroundColor: colors.brand },
  timelineLabel: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.textMuted },
  timelineLabelActive: { fontFamily: fonts.semiBold, color: colors.text },
  cancelledText: { fontFamily: fonts.semiBold, fontSize: fontSize.md, color: colors.danger, textAlign: 'center' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  itemQty: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.text },
  itemPrice: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  totalLabel: { fontFamily: fonts.semiBold, fontSize: fontSize.md, color: colors.text },
  totalValue: { fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.brandDark },
  notFound: { fontFamily: fonts.medium, fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' },
})
