import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { catalogApi, type Medicine } from '@elhazem/shared'
import { supabase, isDemoMode } from '../lib/supabaseClient'
import { demoCategories, demoMedicines } from '../lib/demoData'
import MedicineCard from '../components/MedicineCard'

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) return
    if (isDemoMode) {
      const category = demoCategories.find((c) => c.slug === slug)
      setMedicines(category ? demoMedicines.filter((m) => m.categoryId === category.id) : [])
      setLoading(false)
      return
    }
    if (!supabase) return
    setLoading(true)
    setError(null)
    catalogApi
      .listMedicines(supabase, { categorySlug: slug })
      .then(setMedicines)
      .catch((err) => setError(err instanceof Error ? err.message : 'حصل خطأ أثناء تحميل المنتجات'))
      .finally(() => setLoading(false))
  }, [slug])

  return (
    <div>
      {loading && <div className="py-10 text-center text-sm text-[var(--text-muted)]">جاري التحميل...</div>}
      {error && <div className="py-10 text-center text-sm text-[var(--danger)]">{error}</div>}
      {!loading && !error && medicines.length === 0 && (
        <div className="py-10 text-center text-sm text-[var(--text-muted)]">مفيش منتجات في القسم ده حاليًا</div>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {medicines.map((medicine) => (
          <MedicineCard key={medicine.id} medicine={medicine} />
        ))}
      </div>
    </div>
  )
}
