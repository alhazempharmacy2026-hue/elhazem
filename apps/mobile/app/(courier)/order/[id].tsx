import {
  deliveryApi,
  deliveryStatusLabels,
  formatCurrency,
  formatOrderNumber,
  ordersApi,
  type DeliveryAssignment,
  type DeliveryAssignmentStatus,
  type Order,
  type OrderItem,
} from '@elhazem/shared'
import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Button } from '../../../src/components/Button'
import { Card } from '../../../src/components/Card'
import { LoadingScreen } from '../../../src/components/LoadingScreen'
import { ScreenContainer } from '../../../src/components/ScreenContainer'
import { StatusBadge } from '../../../src/components/StatusBadge'
import { useAuth } from '../../../src/context/AuthContext'
import { useCourierLocationTracking } from '../../../src/hooks/useCourierLocationTracking'
import { colors, fonts, fontSize, spacing } from '../../../src/lib/theme'

// الحالات اللي التتبع الجغرافي بيفضل شغال فيها — التوصيلة بدأت فعليًا ولسه ما اتسلمتش
const TRACKING_ACTIVE_STATUSES: DeliveryAssignmentStatus[] = ['picked_up', 'en_route']

const NEXT_STATUS: Partial<Record<DeliveryAssignmentStatus, { next: DeliveryAssignmentStatus; label: string }>> = {
  assigned: { next: 'picked_up', label: 'استلمت الطلب من الصيدلية' },
  picked_up: { next: 'en_route', label: 'في الطريق للعميل' },
  en_route: { next: 'delivered', label: 'تم التسليم' },
}

export default function CourierOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { client, profile } = useAuth()

  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [assignment, setAssignment] = useState<DeliveryAssignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id || !profile) return
    try {
      const [loadedOrder, loadedItems, assignments] = await Promise.all([
        ordersApi.getOrder(client, id),
        ordersApi.getOrderItems(client, id),
        deliveryApi.listCourierDeliveries(client, profile.id),
      ])
      setOrder(loadedOrder)
      setItems(loadedItems)
      setAssignment(assignments.find((a) => a.orderId === id) ?? null)
    } catch (err) {
      console.warn('فشل تحميل تفاصيل التوصيلة', err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, profile?.id])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const trackingEnabled = Boolean(assignment && TRACKING_ACTIVE_STATUSES.includes(assignment.status))
  const { error: locationError } = useCourierLocationTracking(id ?? '', trackingEnabled)

  async function handleAdvanceStatus() {
    if (!assignment || !id) return
    const step = NEXT_STATUS[assignment.status]
    if (!step) return

    setError(null)
    setUpdating(true)
    try {
      const updatedOrder = await deliveryApi.setDeliveryStatus(client, id, step.next)
      setOrder(updatedOrder)
      setAssignment((prev) => (prev ? { ...prev, status: step.next } : prev))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحديث حالة التوصيلة')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <LoadingScreen />
  if (!order || !assignment) {
    return (
      <ScreenContainer>
        <Text style={styles.notFound}>التوصيلة غير موجودة أو مش مُسندة لك</Text>
      </ScreenContainer>
    )
  }

  const step = NEXT_STATUS[assignment.status]
  const isTerminal = assignment.status === 'delivered' || assignment.status === 'failed'

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.orderNumber}>{formatOrderNumber(order.id)}</Text>
        <StatusBadge label={deliveryStatusLabels[assignment.status]} statusKey={assignment.status} />
      </View>

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

      {order.notes ? (
        <Card>
          <Text style={styles.sectionTitle}>ملاحظات العميل</Text>
          <Text style={styles.notes}>{order.notes}</Text>
        </Card>
      ) : null}

      {trackingEnabled ? (
        <Card>
          <Text style={styles.trackingNotice}>
            بيتم إرسال موقعك الحالي للعميل بشكل دوري طول ما التوصيلة نشطة والشاشة دي مفتوحة.
            {'\n'}ملحوظة: التتبع ده يشتغل بس والتطبيق في المقدمة (Foreground) — لو قفلت التطبيق أو
            رجعته للخلفية هيتوقف الإرسال تلقائيًا (سلوك متعمد في هذه النسخة).
          </Text>
          {locationError ? <Text style={styles.error}>{locationError}</Text> : null}
        </Card>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!isTerminal && step ? (
        <Button title={step.label} onPress={handleAdvanceStatus} loading={updating} />
      ) : (
        <Text style={styles.doneText}>{deliveryStatusLabels[assignment.status]}</Text>
      )}
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontFamily: fonts.bold, fontSize: fontSize.lg, color: colors.text },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: fontSize.md, color: colors.text, textAlign: 'right', marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs },
  itemQty: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.text },
  itemPrice: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  totalLabel: { fontFamily: fonts.semiBold, fontSize: fontSize.md, color: colors.text },
  totalValue: { fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.brandDark },
  notes: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.text, textAlign: 'right' },
  trackingNotice: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'right', lineHeight: 20 },
  error: { fontFamily: fonts.regular, fontSize: fontSize.sm, color: colors.danger, textAlign: 'right', marginTop: spacing.sm },
  doneText: { fontFamily: fonts.semiBold, fontSize: fontSize.md, color: colors.brandDark, textAlign: 'center' },
  notFound: { fontFamily: fonts.medium, fontSize: fontSize.md, color: colors.textMuted, textAlign: 'center' },
})
