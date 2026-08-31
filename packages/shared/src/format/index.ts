export function formatCurrency(value: number): string {
  return `${value.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ج.م`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ar-EG', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatOrderNumber(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`
}
