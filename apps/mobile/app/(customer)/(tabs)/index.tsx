import { catalogApi, type Category, type Medicine } from '@elhazem/shared'
import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { EmptyState } from '../../../src/components/EmptyState'
import { MedicineCard } from '../../../src/components/MedicineCard'
import { useAuth } from '../../../src/context/AuthContext'
import { demoCategories, demoMedicines } from '../../../src/lib/demoData'
import { isDemoMode } from '../../../src/lib/supabaseClient'
import { colors, fonts, fontSize, radius, spacing } from '../../../src/lib/theme'

export default function CatalogScreen() {
  const { client } = useAuth()

  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMedicines = useCallback(async () => {
    setError(null)
    if (isDemoMode) {
      const q = search.trim().toLowerCase()
      const categoryId = selectedCategory ? demoCategories.find((c) => c.slug === selectedCategory)?.id : undefined
      let data = categoryId ? demoMedicines.filter((m) => m.categoryId === categoryId) : demoMedicines
      if (q) data = data.filter((m) => m.nameAr.toLowerCase().includes(q) || m.nameEn?.toLowerCase().includes(q))
      setMedicines(data)
      return
    }
    try {
      const data = await catalogApi.listMedicines(client, {
        categorySlug: selectedCategory ?? undefined,
        search: search.trim() || undefined,
      })
      setMedicines(data)
    } catch (err) {
      setError('حصل خطأ أثناء تحميل الأدوية، اسحب للتحديث')
      console.warn(err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, search])

  useEffect(() => {
    if (isDemoMode) {
      setCategories(demoCategories)
      return
    }
    catalogApi
      .listCategories(client)
      .then(setCategories)
      .catch((err) => console.warn('فشل تحميل الأقسام', err))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setLoading(true)
    loadMedicines().finally(() => setLoading(false))
  }, [loadMedicines])

  async function onRefresh() {
    setRefreshing(true)
    await loadMedicines()
    setRefreshing(false)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="ابحث عن دواء..."
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          textAlign="right"
        />
      </View>

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item.id}
        style={styles.categoryList}
        contentContainerStyle={styles.categoryListContent}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setSelectedCategory((prev) => (prev === item.slug ? null : item.slug))}
            style={[styles.categoryChip, selectedCategory === item.slug && styles.categoryChipActive]}
          >
            <Text style={[styles.categoryChipText, selectedCategory === item.slug && styles.categoryChipTextActive]}>
              {item.nameAr}
            </Text>
          </Pressable>
        )}
      />

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.brand} />
      ) : (
        <FlatList
          data={medicines}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
          ListEmptyComponent={
            <EmptyState
              title={error ?? 'مفيش أدوية مطابقة'}
              subtitle={error ? undefined : 'جرّب كلمة بحث تانية أو قسم مختلف'}
            />
          }
          renderItem={({ item }) => (
            <MedicineCard
              medicine={item}
              onPress={() => router.push(`/(customer)/medicine/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.text,
  },
  categoryList: { flexGrow: 0, marginTop: spacing.md },
  categoryListContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginEnd: spacing.sm,
  },
  categoryChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  categoryChipText: { fontFamily: fonts.medium, fontSize: fontSize.sm, color: colors.text },
  categoryChipTextActive: { color: colors.white },
  loader: { marginTop: spacing.xxl },
  listContent: { padding: spacing.lg, gap: spacing.md },
  row: { gap: spacing.md },
})
