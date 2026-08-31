import { formatCurrency, formatDateTime, formatOrderNumber, ordersApi, orderStatusLabels, type Order } from '@elhazem/shared'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { EmptyState } from '../../../src/components/EmptyState'
import { ScreenContainer } from '../../../src/components/ScreenContainer'
import { StatusBadge } from '../../../src/components/StatusBadge'
import { useAuth } from '../../../src/context/AuthContext'
import { colors, fonts, fontSize, radius, spacing } from '../../../src/lib/theme'

export default function OrderHistoryScreen() {
  const { client, profile } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!profile) return
    try {
      const list = await ordersApi.listMyOrders(client, profile.id)
      setOrders(list)
    } catch (err) {
      console.warn('فشل تحميل الطلبات', err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  // إعادة التحميل كل مرة الشاشة ترجع تظهر (مثلاً بعد إتمام طلب جديد)
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
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
        ListEmptyComponent={<EmptyState title="مفيش طلبات لسه" subtitle="أول ما تعمل طلب هيظهر هنا" />}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(customer)/order/${item.id}/tracking`)}>
            <View style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.orderNumber}>{formatOrderNumber(item.id)}</Text>
                <StatusBadge label={orderStatusLabels[item.status]} statusKey={item.status} />
              </View>
              <View style={styles.row}>
                <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>
                <Text style={styles.total}>{formatCurrency(item.total)}</Text>
              </View>
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
  date: { fontFamily: fonts.regular, fontSize: fontSize.xs, color: colors.textMuted },
  total: { fontFamily: fonts.bold, fontSize: fontSize.sm, color: colors.brandDark },
})
