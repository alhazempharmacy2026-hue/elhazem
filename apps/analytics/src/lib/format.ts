export function formatCurrency(value: number): string {
  return `${value.toLocaleString('ar-EG', { maximumFractionDigits: 0 })} ج.م`
}

export function formatNumber(value: number): string {
  return value.toLocaleString('ar-EG', { maximumFractionDigits: 1 })
}

export function formatPercent(value: number): string {
  // accepts either a fraction (0.18) or an already-scaled percentage (18)
  const pct = value <= 1 ? value * 100 : value
  return `${pct.toLocaleString('ar-EG', { maximumFractionDigits: 1 })}%`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
}

export function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
}
