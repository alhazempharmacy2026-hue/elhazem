import type { Medicine, Sale, SaleItem, PharmacyData } from '../types'

function uid(prefix: string, i: number) {
  return `${prefix}-${i}-${Math.random().toString(36).slice(2, 8)}`
}

function isoDaysFromNow(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const medicineNames: { name: string; category: string }[] = [
  { name: 'بانادول أقراص', category: 'مسكنات' },
  { name: 'بروفين 400', category: 'مسكنات' },
  { name: 'أوجمنتين 1g', category: 'مضادات حيوية' },
  { name: 'زيثروماكس', category: 'مضادات حيوية' },
  { name: 'فيتامين سي 1000', category: 'فيتامينات' },
  { name: 'زنك بلس', category: 'فيتامينات' },
  { name: 'كونجستال', category: 'أدوية باردة' },
  { name: 'رينولايف بخاخ', category: 'أدوية باردة' },
  { name: 'كريم فيوسيدين', category: 'مستحضرات جلدية' },
  { name: 'كريم دايبر راش', category: 'رعاية أطفال' },
  { name: 'جلوكوفاج 500', category: 'أدوية مزمنة' },
  { name: 'كونكور 5', category: 'أدوية مزمنة' },
  { name: 'نيكسيوم 40', category: 'أدوية مزمنة' },
  { name: 'انفلاجين شراب أطفال', category: 'رعاية أطفال' },
  { name: 'فيروجلوبين شراب', category: 'فيتامينات' },
  { name: 'أموكسيل 500', category: 'مضادات حيوية' },
  { name: 'كتافلام أقراص', category: 'مسكنات' },
  { name: 'ديفلوكان كبسول', category: 'مضادات حيوية' },
  { name: 'أوميجا 3', category: 'فيتامينات' },
  { name: 'سيتال شراب أطفال', category: 'رعاية أطفال' },
]

const suppliers = ['شركة النيل للأدوية', 'مصر للمستودعات الطبية', 'دلتا فارما', 'المتحدة للتوزيع الدوائي']

export function seedPharmacyData(): PharmacyData {
  const medicines: Medicine[] = medicineNames.map((m, i) => {
    const costPrice = Number((5 + Math.random() * 80).toFixed(2))
    const sellPrice = Number((costPrice * (1.15 + Math.random() * 0.35)).toFixed(2))
    // a few items intentionally low stock or near expiry for realistic alerts
    const lowStockCase = i % 6 === 0
    const nearExpiryCase = i % 7 === 0
    return {
      id: uid('med', i),
      name: m.name,
      category: m.category,
      unit: 'علبة',
      stock: lowStockCase ? Math.floor(Math.random() * 5) : Math.floor(10 + Math.random() * 150),
      minStock: 15,
      costPrice,
      sellPrice,
      expiryDate: nearExpiryCase ? isoDaysFromNow(Math.floor(Math.random() * 25) + 1) : isoDaysFromNow(Math.floor(180 + Math.random() * 500)),
      supplier: suppliers[i % suppliers.length],
    }
  })

  const sales: Sale[] = []
  const days = 30
  for (let d = days; d >= 0; d--) {
    const date = new Date()
    date.setDate(date.getDate() - d)
    const salesPerDay = 3 + Math.floor(Math.random() * 8)
    for (let s = 0; s < salesPerDay; s++) {
      const itemCount = 1 + Math.floor(Math.random() * 3)
      const items: SaleItem[] = []
      const used = new Set<number>()
      for (let it = 0; it < itemCount; it++) {
        let idx = Math.floor(Math.random() * medicines.length)
        if (used.has(idx)) continue
        used.add(idx)
        const med = medicines[idx]
        const qty = 1 + Math.floor(Math.random() * 3)
        items.push({ medicineId: med.id, name: med.name, qty, unitPrice: med.sellPrice, unitCost: med.costPrice })
      }
      if (items.length === 0) continue
      const total = Number(items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0).toFixed(2))
      date.setHours(9 + Math.floor(Math.random() * 12), Math.floor(Math.random() * 60))
      sales.push({
        id: uid('sale', sales.length),
        date: date.toISOString(),
        items,
        total,
      })
    }
  }

  return { medicines, sales }
}
