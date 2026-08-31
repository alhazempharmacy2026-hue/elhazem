import { SALES_COLUMNS } from '../data/salesColumns'
import { parseCSV } from './csv'

export interface ParsedSalesRow {
  name: string
  code?: string
  quantitySold: number
}

export interface SalesImportResult {
  rows: ParsedSalesRow[]
  skippedRows: number
  unmatchedHeaders: string[]
}

function normalizeHeader(h: string): string {
  return h.trim().replace(/\s+/g, ' ')
}

function parseNumber(raw: string): number | undefined {
  const cleaned = raw.replace(/[,\s]/g, '')
  if (cleaned === '' || cleaned === '-') return undefined
  const n = Number(cleaned)
  return isNaN(n) ? undefined : n
}

export function importSalesFromCSV(text: string): SalesImportResult {
  const rows = parseCSV(text)
  if (rows.length === 0) return { rows: [], skippedRows: 0, unmatchedHeaders: [] }

  const headerRow = rows[0].map(normalizeHeader)
  const colByIndex = headerRow.map((h) => SALES_COLUMNS.find((c) => c.label === h))
  const unmatchedHeaders = headerRow.filter((_, i) => !colByIndex[i])
  const nameColIndex = colByIndex.findIndex((c) => c?.key === 'name')
  const qtyColIndex = colByIndex.findIndex((c) => c?.key === 'quantitySold')
  const codeColIndex = colByIndex.findIndex((c) => c?.key === 'code')

  const parsed: ParsedSalesRow[] = []
  let skippedRows = 0

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    const name = nameColIndex >= 0 ? (cells[nameColIndex] ?? '').trim() : ''
    const quantitySold = qtyColIndex >= 0 ? parseNumber(cells[qtyColIndex] ?? '') : undefined
    if (!name || quantitySold === undefined) {
      skippedRows++
      continue
    }
    const code = codeColIndex >= 0 ? (cells[codeColIndex] ?? '').trim() || undefined : undefined
    parsed.push({ name, code, quantitySold })
  }

  return { rows: parsed, skippedRows, unmatchedHeaders: [...new Set(unmatchedHeaders)] }
}
