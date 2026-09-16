import type { MounjaroCustomer, MounjaroDose } from '../types'

// مستويات جرعة المونجارو (تيرزيباتيد) المعتادة، من الجرعة الابتدائية للجرعة القصوى.
export const DOSE_LEVELS = [2.5, 5, 7.5, 10, 12.5, 15] as const

// المونجارو حقنة أسبوعية — الجرعة القادمة المتوقعة بعد ٧ أيام من آخر جرعة.
export const DOSE_INTERVAL_DAYS = 7

export const STATUS_LABEL: Record<MounjaroCustomer['status'], string> = {
  active: 'نشط',
  paused: 'متوقف',
  completed: 'انتهى البرنامج',
}

export type DueStatus = 'overdue' | 'dueSoon' | 'ok' | 'none'

export const DUE_STATUS_LABEL: Record<DueStatus, string> = {
  overdue: 'متأخرة',
  dueSoon: 'مستحقة قريبًا',
  ok: 'مجدولة',
  none: 'لا توجد جرعات',
}

function daysBetween(from: string, to: string): number {
  const ms = new Date(to).getTime() - new Date(from).getTime()
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export function dosesForCustomer(customerId: string, doses: MounjaroDose[]): MounjaroDose[] {
  return doses.filter((d) => d.customerId === customerId).sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function lastDose(customerId: string, doses: MounjaroDose[]): MounjaroDose | undefined {
  return dosesForCustomer(customerId, doses)[0]
}

export function nextDoseDate(last: MounjaroDose | undefined): string | undefined {
  if (!last) return undefined
  const d = new Date(last.date)
  d.setDate(d.getDate() + DOSE_INTERVAL_DAYS)
  return d.toISOString().slice(0, 10)
}

export function dueStatus(customer: MounjaroCustomer, doses: MounjaroDose[], today = new Date().toISOString().slice(0, 10)): DueStatus {
  if (customer.status !== 'active') return 'none'
  const last = lastDose(customer.id, doses)
  const next = nextDoseDate(last)
  if (!next) return 'none'
  const diff = daysBetween(today, next)
  if (diff < 0) return 'overdue'
  if (diff <= 2) return 'dueSoon'
  return 'ok'
}

// الجرعة المقترحة للمرة القادمة: تصعيد للمستوى التالي بعد ٤ جرعات متتالية على نفس المستوى
// (٤ أسابيع تقريبًا)، وإلا نفس الجرعة الحالية. تتوقف عند أعلى مستوى مسجل.
export function suggestedNextDose(customerId: string, doses: MounjaroDose[]): number | undefined {
  const history = dosesForCustomer(customerId, doses) // أحدث جرعة أولًا
  if (history.length === 0) return DOSE_LEVELS[0]
  const current = history[0].doseMg
  const consecutiveAtCurrent = history.findIndex((d) => d.doseMg !== current)
  const streak = consecutiveAtCurrent === -1 ? history.length : consecutiveAtCurrent
  const levelIndex = DOSE_LEVELS.indexOf(current as (typeof DOSE_LEVELS)[number])
  if (streak >= 4 && levelIndex >= 0 && levelIndex < DOSE_LEVELS.length - 1) {
    return DOSE_LEVELS[levelIndex + 1]
  }
  return current
}

export function totalPaid(customerId: string, doses: MounjaroDose[]): number {
  return dosesForCustomer(customerId, doses).reduce((sum, d) => sum + (d.price ?? 0), 0)
}

export function weightLoss(customer: MounjaroCustomer, doses: MounjaroDose[]): number | undefined {
  const last = lastDose(customer.id, doses)
  const currentWeight = last?.weight ?? customer.startWeight
  if (customer.startWeight === undefined || currentWeight === undefined) return undefined
  return customer.startWeight - currentWeight
}

export function currentWeight(customer: MounjaroCustomer, doses: MounjaroDose[]): number | undefined {
  return lastDose(customer.id, doses)?.weight ?? customer.startWeight
}
