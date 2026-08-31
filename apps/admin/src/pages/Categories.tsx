import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Loader2, Plus } from 'lucide-react'
import { getSupabaseClient } from '../lib/supabaseClient'

interface CategoryRow {
  id: string
  name_ar: string
  slug: string
  sort_order: number
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ\s-]/g, '')
    .replace(/\s+/g, '-')
}

export default function Categories() {
  const client = getSupabaseClient()
  const [categories, setCategories] = useState<CategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const [nameAr, setNameAr] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: loadError } = await client.from('categories').select('*').order('sort_order', { ascending: true })
    if (loadError) {
      setError(loadError.message)
    } else {
      setCategories(data ?? [])
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `client` singleton ثابت
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleAdd(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    if (!nameAr.trim()) {
      setFormError('اسم الفئة مطلوب')
      return
    }
    setSaving(true)
    try {
      const nextSortOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 0
      const { error: insertError } = await client.from('categories').insert({
        name_ar: nameAr.trim(),
        slug: slugify(nameAr) || crypto.randomUUID(),
        sort_order: nextSortOrder,
      })
      if (insertError) throw insertError
      setNameAr('')
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'تعذر إضافة الفئة')
    } finally {
      setSaving(false)
    }
  }

  async function handleRename(category: CategoryRow, newName: string) {
    if (!newName.trim() || newName === category.name_ar) return
    setBusyId(category.id)
    try {
      const { error: updateError } = await client.from('categories').update({ name_ar: newName.trim() }).eq('id', category.id)
      if (updateError) throw updateError
      setCategories((prev) => prev.map((c) => (c.id === category.id ? { ...c, name_ar: newName.trim() } : c)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تعديل اسم الفئة')
    } finally {
      setBusyId(null)
    }
  }

  async function handleReorder(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= categories.length) return
    const a = categories[index]
    const b = categories[target]
    setBusyId(a.id)
    try {
      const [resA, resB] = await Promise.all([
        client.from('categories').update({ sort_order: b.sort_order }).eq('id', a.id),
        client.from('categories').update({ sort_order: a.sort_order }).eq('id', b.id),
      ])
      if (resA.error) throw resA.error
      if (resB.error) throw resB.error
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تغيير الترتيب')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-[var(--text)]">الفئات</h1>
      <p className="mb-5 text-sm text-[var(--text-muted)]">تصنيفات الأدوية المعروضة للعملاء وترتيبها</p>

      <form onSubmit={handleAdd} className="mb-5 flex flex-wrap items-end gap-2 rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <label className="min-w-[200px] flex-1">
          <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">اسم فئة جديدة</span>
          <input className="input w-full" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="مثال: مسكنات" />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-dark)] disabled:opacity-60"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
          إضافة
        </button>
      </form>
      {formError && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-[var(--danger)]">{formError}</div>}

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-[var(--text-muted)]">
            <Loader2 className="animate-spin" size={18} />
            جاري التحميل...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-[var(--danger)]">{error}</div>
        ) : categories.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--text-muted)]">مفيش فئات لسه</div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {categories.map((category, index) => (
              <li key={category.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex flex-col">
                  <button
                    disabled={index === 0 || busyId !== null}
                    onClick={() => void handleReorder(index, -1)}
                    className="text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    disabled={index === categories.length - 1 || busyId !== null}
                    onClick={() => void handleReorder(index, 1)}
                    className="text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
                <input
                  className="input flex-1"
                  defaultValue={category.name_ar}
                  disabled={busyId === category.id}
                  onBlur={(e) => void handleRename(category, e.target.value)}
                />
                <span className="text-xs text-[var(--text-muted)]" dir="ltr">
                  {category.slug}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
