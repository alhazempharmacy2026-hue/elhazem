import {
  deliveryApi,
  deliveryStatusLabels,
  formatCurrency,
  formatOrderNumber,
  ordersApi,
  type DeliveryAssignment,
  type Order,
} from '@elhazem/shared'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { EmptyState } from '../../../src/components/EmptyState'
import { ScreenContainer } from '../../../src/components/ScreenContainer'
import { StatusBadge } from '../../../src/components/StatusBadge'
import { useAuth } from '../../../src/context/AuthContext'
import { colors, fonts, fontSize, radius, spacing } from '../../../src/lib/theme'

interface DeliveryRow {
  assignment: DeliveryAssignment
  order: Order | null
}

export default function CourierOrdersScreen() {
  const { client, profile } = useAuth()
  const [rows, setRows] = useState<DeliveryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!profile) return
    try {
      const assignments = await deliveryApi.listCourierDeliveries(client, profile.id)
      const withOrders = await Promise.all(
        assignments.map(async (assignment) => ({
          assignment,
          order: await ordersApi.getOrder(client, assignment.orderId).catch(() => null),
        })),
      )
      setRows(withOrders)
    } catch (err) {
      console.warn('فشل تحميل التوصيلات', err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      load().finally(() => setLoading(false))
    }, [load]),
  )

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <ScreenContainer scroll={false}>
        <ActivityIndicator style={styles.loader} color={colors.brand} />
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer scroll={false}>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.assignment.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        ListEmptyComponent={<EmptyState title="مفيش توصيلات مُسندة لك دلوقتي" />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(courier)/order/${item.assignment.orderId}`)}>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.orderNumber}>{formatOrderNumber(item.assignment.orderId)}</Text>
                <StatusBadge
                  label={deliveryStatusLabels[item.assignment.status]}
                  statusKey={item.assignment.status}
                />
              </View>
              {item.order ? <Text style={styles.total}>{formatCurrency(item.order.total)}</Text> : null}
            </View>
          </Pressable>
        )}
      />
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xxl },
  listContent: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontFamily: fonts.semiBold, fontSize: fontSize.md, color: colors.text },
  total: { fontFamily: fonts.bold, fontSize: fontSize.sm, color: colors.brandDark, textAlign: 'right' },
})
