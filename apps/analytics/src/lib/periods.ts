function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d)
  const day = copy.getDay() // 0 = Sunday
  copy.setDate(copy.getDate() - day)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

export interface Range {
  start: string
  end: string
}

export interface ComparisonPreset {
  key: string
  label: string
  current: Range
  previous: Range
}

export function buildPresets(): ComparisonPreset[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const last7Start = addDays(today, -6)
  const prev7End = addDays(last7Start, -1)
  const prev7Start = addDays(prev7End, -6)

  const last30Start = addDays(today, -29)
  const prev30End = addDays(last30Start, -1)
  const prev30Start = addDays(prev30End, -29)

  const weekStart = startOfWeek(today)
  const prevWeekEnd = addDays(weekStart, -1)
  const prevWeekStart = addDays(weekStart, -7)

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const prevMonthEnd = addDays(monthStart, -1)
  const prevMonthStart = new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), 1)

  return [
    {
      key: '7v7',
      label: 'آخر ٧ أيام مقابل الـ٧ اللي قبلها',
      current: { start: iso(last7Start), end: iso(today) },
      previous: { start: iso(prev7Start), end: iso(prev7End) },
    },
    {
      key: '30v30',
      label: 'آخر ٣٠ يوم مقابل الـ٣٠ اللي قبلها',
      current: { start: iso(last30Start), end: iso(today) },
      previous: { start: iso(prev30Start), end: iso(prev30End) },
    },
    {
      key: 'weekvweek',
      label: 'الأسبوع الحالي مقابل الأسبوع اللي فات',
      current: { start: iso(weekStart), end: iso(today) },
      previous: { start: iso(prevWeekStart), end: iso(prevWeekEnd) },
    },
    {
      key: 'monthvmonth',
      label: 'الشهر الحالي مقابل الشهر اللي فات',
      current: { start: iso(monthStart), end: iso(today) },
      previous: { start: iso(prevMonthStart), end: iso(prevMonthEnd) },
    },
  ]
}
