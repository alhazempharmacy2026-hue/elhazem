export function formatCurrency(value: number): string {
  return `${value.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function daysUntil(iso: string): number {
  const target = new Date(iso).setHours(0, 0, 0, 0)
  const today = new Date().setHours(0, 0, 0, 0)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}
