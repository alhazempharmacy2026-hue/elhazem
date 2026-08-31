import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Loader2, Pencil, Plus, Search, Upload, X } from 'lucide-react'
import { formatCurrency } from '@elhazem/shared'
import { getSupabaseClient } from '../lib/supabaseClient'
import StatusBadge from '../components/StatusBadge'

// النوع ده بيمثل صف جدول `medicines` زي ما هو معرّف في supabase/migrations/0001_init_schema.sql —
// شكله بالظبط زي `Database['public']['Tables']['medicines']['Row']` في الحزمة المشتركة، لكن
// المكتبة المشتركة مش بتصدّر نوع `Database` نفسه، فبنعيد وصفه هنا محليًا.
interface MedicineRow {
  id: string
  name_ar: string
  name_en: string | null
  description_ar: string | null
  category_id: string | null
  sku: string | null
  manufacturer: string | null
  price: number
  stock_quantity: number
  requires_prescription: boolean
  image_url: string | null
  active: boolean
}

interface CategoryOption {
  id: string
  name_ar: string
}

interface MedicineFormState {
  id: string | null
  name_ar: string
  name_en: string
  description_ar: string
  category_id: string
  sku: string
  manufacturer: string
  price: string
  stock_quantity: string
  requires_prescription: boolean
  active: boolean
  image_url: string | null
}

const EMPTY_FORM: MedicineFormState = {
  id: null,
  name_ar: '',
  name_en: '',
  description_ar: '',
  category_id: '',
  sku: '',
  manufacturer: '',
  price: '',
  stock_quantity: '0',
  requires_prescription: false,
  active: true,
  image_url: null,
}

export default function Catalog() {
  const client = getSupabaseClient()
  const [medicines, setMedicines] = useState<MedicineRow[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<MedicineFormState>(EMPTY_FORM)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [medicinesRes, categoriesRes] = await Promise.all([
        client.from('medicines').select('*').order('name_ar', { ascending: true }),
        client.from('categories').select('id, name_ar').order('sort_order', { ascending: true }),
      ])
      if (medicinesRes.error) throw medicinesRes.error
      if (categoriesRes.error) throw categoriesRes.error
      setMedicines(medicinesRes.data ?? [])
      setCategories(categoriesRes.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل الأدوية')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `client` singleton ثابت
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const categoryName = useMemo(() => {
    const map: Record<string, string> = {}
    for (const c of categories) map[c.id] = c.name_ar
    return map
  }, [categories])

  const filtered = useMemo(() => {
    const q = search.trim()
    if (!q) return medicines
    return medicines.filter((m) => m.name_ar.includes(q) || (m.name_en ?? '').toLowerCase().includes(q.toLowerCase()))
  }, [medicines, search])

  function openAddForm() {
    setForm(EMPTY_FORM)
    setImageFile(null)
    setFormError(null)
    setFormOpen(true)
  }

  function openEditForm(m: MedicineRow) {
    setForm({
      id: m.id,
      name_ar: m.name_ar,
      name_en: m.name_en ?? '',
      description_ar: m.description_ar ?? '',
      category_id: m.category_id ?? '',
      sku: m.sku ?? '',
      manufacturer: m.manufacturer ?? '',
      price: String(m.price),
      stock_quantity: String(m.stock_quantity),
      requires_prescription: m.requires_prescription,
      active: m.active,
      image_url: m.image_url,
    })
    setImageFile(null)
    setFormError(null)
    setFormOpen(true)
  }

  async function handleToggleActive(m: MedicineRow) {
    try {
      const { error: updateError } = await client.from('medicines').update({ active: !m.active }).eq('id', m.id)
      if (updateError) throw updateError
      setMedicines((prev) => prev.map((row) => (row.id === m.id ? { ...row, active: !row.active } : row)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديث حالة الصنف')
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const price = Number(form.price)
    const stock = Number(form.stock_quantity)
    if (!form.name_ar.trim()) {
      setFormError('اسم الدواء بالعربي مطلوب')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      setFormError('السعر لازم يكون رقم صحيح')
      return
    }
    if (!Number.isFinite(stock) || stock < 0) {
      setFormError('الكمية بالمخزون لازم تكون رقم صحيح')
      return
    }

    setSaving(true)
    try {
      let imageUrl = form.image_url

      if (imageFile) {
        const ext = imageFile.name.split('.').pop() ?? 'jpg'
        const path = `${crypto.randomUUID()}.${ext}`
        const { error: uploadError } = await client.storage.from('medicine-images').upload(path, imageFile, {
          contentType: imageFile.type || undefined,
          upsert: false,
        })
        if (uploadError) throw uploadError
        imageUrl = client.storage.from('medicine-images').getPublicUrl(path).data.publicUrl
      }

      const payload = {
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim() || null,
        description_ar: form.description_ar.trim() || null,
        category_id: form.category_id || null,
        sku: form.sku.trim() || null,
        manufacturer: form.manufacturer.trim() || null,
        price,
        stock_quantity: stock,
        requires_prescription: form.requires_prescription,
        active: form.active,
        image_url: imageUrl,
      }

      if (form.id) {
        const { error: updateError } = await client.from('medicines').update(payload).eq('id', form.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await client.from('medicines').insert(payload)
        if (insertError) throw insertError
      }

      setFormOpen(false)
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'تعذر حفظ الصنف')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mb-1 text-xl font-bold text-[var(--text)]">الأدوية</h1>
          <p className="text-sm text-[var(--text-muted)]">إدارة الأصناف المعروضة للعملاء</p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
        >
          <Plus size={16} />
          إضافة دواء
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2">
        <Search size={16} className="text-[var(--text-muted)]" />
        <input
          className="w-full text-sm outline-none"
          placeholder="ابحث بالاسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-[var(--text-muted)]">
            <Loader2 className="animate-spin" size={18} />
            جاري التحميل...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-[var(--danger)]">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--text-muted)]">مفيش أدوية مطابقة</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-right text-xs text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium">الاسم</th>
                  <th className="px-4 py-3 font-medium">الفئة</th>
                  <th className="px-4 py-3 font-medium">السعر</th>
                  <th className="px-4 py-3 font-medium">المخزون</th>
                  <th className="px-4 py-3 font-medium">وصفة طبية</th>
                  <th className="px-4 py-3 font-medium">الحالة</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <tr key={m.id} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--text)]">{m.name_ar}</div>
                      {m.sku && <div className="text-xs text-[var(--text-muted)]">SKU: {m.sku}</div>}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {m.category_id ? (categoryName[m.category_id] ?? '—') : '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--text)]">{formatCurrency(m.price)}</td>
                    <td className="px-4 py-3 text-[var(--text)]">{m.stock_quantity}</td>
                    <td className="px-4 py-3">
                      <StatusBadge label={m.requires_prescription ? 'مطلوبة' : 'غير مطلوبة'} tone={m.requires_prescription ? 'warning' : 'neutral'} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => void handleToggleActive(m)}
                        title="تبديل حالة النشاط"
                      >
                        <StatusBadge label={m.active ? 'نشط' : 'موقوف'} tone={m.active ? 'brand' : 'danger'} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <button
                        onClick={() => openEditForm(m)}
                        className="rounded-lg border border-[var(--border)] p-1.5 text-[var(--text-muted)] hover:bg-gray-100"
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--text)]">{form.id ? 'تعديل دواء' : 'إضافة دواء'}</h2>
              <button type="button" onClick={() => setFormOpen(false)} className="text-[var(--text-muted)]">
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-3">
              <label>
                <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">الاسم بالعربي *</span>
                <input
                  required
                  className="input w-full"
                  value={form.name_ar}
                  onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">الاسم بالإنجليزي</span>
                <input
                  className="input w-full"
                  dir="ltr"
                  value={form.name_en}
                  onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">الوصف</span>
                <textarea
                  className="input w-full"
                  rows={2}
                  value={form.description_ar}
                  onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
                />
              </label>

              <label>
                <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">الفئة</span>
                <select
                  className="input w-full"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                >
                  <option value="">بدون فئة</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_ar}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">SKU</span>
                  <input className="input w-full" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">الشركة المصنعة</span>
                  <input
                    className="input w-full"
                    value={form.manufacturer}
                    onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">السعر (ج.م) *</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    className="input w-full"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">الكمية بالمخزون *</span>
                  <input
                    required
                    type="number"
                    step="1"
                    min="0"
                    className="input w-full"
                    value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                  />
                </label>
              </div>

              <label>
                <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">صورة الدواء</span>
                <div className="flex items-center gap-3">
                  {form.image_url && !imageFile && (
                    <img src={form.image_url} alt="" className="h-12 w-12 rounded-lg border border-[var(--border)] object-cover" />
                  )}
                  <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-gray-50">
                    <Upload size={14} />
                    {imageFile ? imageFile.name : 'اختر صورة...'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </label>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                  <input
                    type="checkbox"
                    checked={form.requires_prescription}
                    onChange={(e) => setForm({ ...form, requires_prescription: e.target.checked })}
                  />
                  يحتاج وصفة طبية
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--text)]">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  />
                  نشط (يظهر للعملاء)
                </label>
              </div>
            </div>

            {formError && (
              <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-[var(--danger)]" role="alert">
                {formError}
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-dark)] disabled:opacity-60"
              >
                {saving && <Loader2 className="animate-spin" size={16} />}
                حفظ
              </button>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-muted)] hover:bg-gray-50"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
