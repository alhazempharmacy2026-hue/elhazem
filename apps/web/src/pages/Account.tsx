import { useEffect, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { addressesApi, addressSchema, type Address } from '@elhazem/shared'
import { supabase, isDemoMode } from '../lib/supabaseClient'
import { demoAddress } from '../lib/demoData'
import { useAuth } from '../lib/AuthContext'

const emptyAddress = {
  label: '',
  governorate: '',
  city: '',
  street: '',
  building: '',
  floor: '',
  apartment: '',
  landmark: '',
  lat: null as number | null,
  lng: null as number | null,
  isDefault: false,
}

export default function Account() {
  const { profile } = useAuth()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyAddress)
  const [error, setError] = useState<string | null>(null)

  function loadAddresses() {
    if (isDemoMode) {
      setAddresses([demoAddress])
      return
    }
    if (!supabase || !profile) return
    addressesApi.listAddresses(supabase, profile.id).then(setAddresses)
  }

  useEffect(loadAddresses, [profile])

  async function handleAddAddress(event: FormEvent) {
    event.preventDefault()
    setError(null)
    const parsed = addressSchema.safeParse(form)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة')
      return
    }
    if (!supabase || !profile) return
    await addressesApi.createAddress(supabase, profile.id, {
      ...parsed.data,
      floor: parsed.data.floor ?? null,
      apartment: parsed.data.apartment ?? null,
      landmark: parsed.data.landmark ?? null,
      lat: parsed.data.lat ?? null,
      lng: parsed.data.lng ?? null,
      isDefault: parsed.data.isDefault ?? false,
    })
    setForm(emptyAddress)
    setShowForm(false)
    loadAddresses()
  }

  async function handleDelete(id: string) {
    if (!supabase) return
    await addressesApi.deleteAddress(supabase, id)
    loadAddresses()
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h1 className="mb-3 text-lg font-bold">بياناتي</h1>
        <div className="text-sm text-[var(--text-muted)]">الاسم: {profile?.fullName ?? '—'}</div>
        <div className="text-sm text-[var(--text-muted)]" dir="ltr">
          الموبايل: {profile?.phone ?? '—'}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">عناويني</h2>
          {!isDemoMode && (
            <button onClick={() => setShowForm((s) => !s)} className="text-xs font-medium text-[var(--brand-dark)]">
              {showForm ? 'إلغاء' : '+ عنوان جديد'}
            </button>
          )}
        </div>

        <div className="space-y-2">
          {addresses.map((address) => (
            <div key={address.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] p-3">
              <div className="text-xs">
                <div className="font-semibold">{address.label}</div>
                <div className="text-[var(--text-muted)]">
                  {address.governorate}، {address.city}، {address.street}، مبنى {address.building}
                </div>
              </div>
              {!isDemoMode && (
                <button onClick={() => handleDelete(address.id)} className="p-2 text-[var(--danger)]">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          {addresses.length === 0 && <p className="text-xs text-[var(--text-muted)]">مفيش عناوين محفوظة</p>}
        </div>

        {showForm && !isDemoMode && (
          <form onSubmit={handleAddAddress} className="mt-4 space-y-2 border-t border-[var(--border)] pt-4">
            <input
              className="input"
              placeholder="اسم العنوان (المنزل، الشغل...)"
              value={form.label}
              onChange={(event) => setForm({ ...form, label: event.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="input"
                placeholder="المحافظة"
                value={form.governorate}
                onChange={(event) => setForm({ ...form, governorate: event.target.value })}
              />
              <input
                className="input"
                placeholder="المدينة/المركز"
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
              />
            </div>
            <input
              className="input"
              placeholder="الشارع"
              value={form.street}
              onChange={(event) => setForm({ ...form, street: event.target.value })}
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                className="input"
                placeholder="عمارة"
                value={form.building}
                onChange={(event) => setForm({ ...form, building: event.target.value })}
              />
              <input
                className="input"
                placeholder="دور"
                value={form.floor}
                onChange={(event) => setForm({ ...form, floor: event.target.value })}
              />
              <input
                className="input"
                placeholder="شقة"
                value={form.apartment}
                onChange={(event) => setForm({ ...form, apartment: event.target.value })}
              />
            </div>
            <input
              className="input"
              placeholder="علامة مميزة (اختياري)"
              value={form.landmark}
              onChange={(event) => setForm({ ...form, landmark: event.target.value })}
            />
            {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
            <button type="submit" className="btn-primary w-full">
              حفظ العنوان
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
