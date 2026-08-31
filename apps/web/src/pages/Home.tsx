import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { catalogApi, type Category, type Medicine } from '@elhazem/shared'
import { supabase, isDemoMode } from '../lib/supabaseClient'
import { demoCategories, demoMedicines } from '../lib/demoData'
import MedicineCard from '../components/MedicineCard'

export default function Home() {
  const [params] = useSearchParams()
  const query = params.get('q') ?? ''
  const [categories, setCategories] = useState<Category[]>([])
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isDemoMode) {
      const q = query.trim().toLowerCase()
      setCategories(demoCategories)
      setMedicines(q ? demoMedicines.filter((m) => m.nameAr.toLowerCase().includes(q) || m.nameEn?.toLowerCase().includes(q)) : demoMedicines)
      setLoading(false)
      return
    }
    if (!supabase) return
    setLoading(true)
    setError(null)
    Promise.all([catalogApi.listCategories(supabase), catalogApi.listMedicines(supabase, { search: query || undefined })])
      .then(([cats, meds]) => {
        setCategories(cats)
        setMedicines(meds)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'حصل خطأ أثناء تحميل الكتالوج'))
      .finally(() => setLoading(false))
  }, [query])

  return (
    <div className="space-y-8">
      {!query && (
        <div className="rounded-2xl bg-gradient-to-l from-[var(--brand)] to-[var(--brand-dark)] p-6 text-white sm:p-10">
          <h1 className="text-xl font-bold sm:text-2xl">أدويتك ومنتجاتك من صيدلية الحازم توصلك لحد باب البيت</h1>
          <p className="mt-2 text-sm text-white/80">تصفح، اطلب، وارفع روشتتك بسهولة — وتابع طلبك أول بأول</p>
        </div>
      )}

      {categories.length > 0 && !query && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-[var(--text)]">تصفح حسب القسم</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="shrink-0 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-medium text-[var(--text)] hover:border-[var(--brand)]"
              >
                {category.nameAr}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-bold text-[var(--text)]">{query ? `نتائج البحث عن "${query}"` : 'كل المنتجات'}</h2>
        {loading && <div className="py-10 text-center text-sm text-[var(--text-muted)]">جاري التحميل...</div>}
        {error && <div className="py-10 text-center text-sm text-[var(--danger)]">{error}</div>}
        {!loading && !error && medicines.length === 0 && (
          <div className="py-10 text-center text-sm text-[var(--text-muted)]">مفيش نتائج</div>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {medicines.map((medicine) => (
            <MedicineCard key={medicine.id} medicine={medicine} />
          ))}
        </div>
      </section>
    </div>
  )
}
