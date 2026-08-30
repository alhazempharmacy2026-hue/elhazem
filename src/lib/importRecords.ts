import { COLUMNS, HEADER_ALIASES } from '../data/columns'
import { parseCSV } from './csv'
import type { DailyRecord } from '../types'

export interface ImportResult {
  records: DailyRecord[]
  skippedRows: number
  unmatchedHeaders: string[]
}

function normalizeHeader(h: string): string {
  return h.trim().replace(/\s+/g, ' ')
}

function parseDate(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  // Excel serial date number (days since 1899-12-30)
  if (/^\d{4,6}(\.\d+)?$/.test(trimmed)) {
    const serial = Number(trimmed)
    const epoch = new Date(Date.UTC(1899, 11, 30))
    epoch.setUTCDate(epoch.getUTCDate() + Math.floor(serial))
    return epoch.toISOString().slice(0, 10)
  }

  // yyyy-mm-dd
  let m = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`

  // dd/mm/yyyy or mm/dd/yyyy — assume dd/mm/yyyy (common in Egypt locale exports)
  m = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (m) {
    const a = Number(m[1])
    const b = Number(m[2])
    const day = a > 12 ? a : b > 12 ? b : a
    const month = a > 12 ? b : b > 12 ? a : b
    return `${m[3]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const parsed = new Date(trimmed)
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10)
  return null
}

function parseNumber(raw: string): number | undefined {
  const cleaned = raw.replace(/[,\s]/g, '')
  if (cleaned === '' || cleaned === '-') return undefined
  const n = Number(cleaned)
  return isNaN(n) ? undefined : n
}

export function importFromCSV(text: string): ImportResult {
  const rows = parseCSV(text)
  if (rows.length === 0) return { records: [], skippedRows: 0, unmatchedHeaders: [] }

  const headerRow = rows[0].map(normalizeHeader)
  const fieldByColumnIndex = headerRow.map((h) => {
    const col = COLUMNS.find((c) => c.label === h)
    if (col) return col
    const alias = HEADER_ALIASES[h]
    if (alias) return COLUMNS.find((c) => c.key === alias)
    return undefined
  })

  const unmatchedHeaders = headerRow.filter((_, i) => !fieldByColumnIndex[i])
  const dateColIndex = fieldByColumnIndex.findIndex((c) => c?.key === 'date')

  const records: DailyRecord[] = []
  let skippedRows = 0

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    if (dateColIndex === -1) {
      skippedRows++
      continue
    }
    const date = parseDate(cells[dateColIndex] ?? '')
    if (!date) {
      skippedRows++
      continue
    }

    const record: DailyRecord = { id: `rec-${date}-${Math.random().toString(36).slice(2, 7)}`, date }
    for (let c = 0; c < cells.length; c++) {
      const col = fieldByColumnIndex[c]
      if (!col || col.key === 'date') continue
      const raw = cells[c] ?? ''
      if (raw.trim() === '') continue
      if (col.kind === 'number') {
        const n = parseNumber(raw)
        if (n !== undefined) (record as unknown as Record<string, number>)[col.key] = n
      } else {
        ;(record as unknown as Record<string, string>)[col.key] = raw.trim()
      }
    }
    records.push(record)
  }

  return { records, skippedRows, unmatchedHeaders: [...new Set(unmatchedHeaders)] }
}
