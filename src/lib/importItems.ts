import { ITEM_COLUMNS } from '../data/itemColumns'
import { parseCSV } from './csv'
import { parsePharmacyItemsReport } from './importPharmacyItemsReport'

export interface ParsedItemRow {
  name: string
  code?: string
  unit?: string
  category?: string
  currentStock?: number
  minStock?: number
  purchasePrice?: number
  salePrice?: number
  supplierName?: string
}

export interface ItemImportResult {
  rows: ParsedItemRow[]
  skippedRows: number
  unmatchedHeaders: string[]
  detectedPharmacySoftwareReport?: boolean
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

export function importItemsFromCSV(text: string): ItemImportResult {
  const special = parsePharmacyItemsReport(text)
  if (special) {
    return { rows: special, skippedRows: 0, unmatchedHeaders: [], detectedPharmacySoftwareReport: true }
  }

  const rows = parseCSV(text)
  if (rows.length === 0) return { rows: [], skippedRows: 0, unmatchedHeaders: [] }

  const headerRow = rows[0].map(normalizeHeader)
  const colByIndex = headerRow.map((h) => ITEM_COLUMNS.find((c) => c.label === h))
  const unmatchedHeaders = headerRow.filter((_, i) => !colByIndex[i])
  const nameColIndex = colByIndex.findIndex((c) => c?.key === 'name')

  const parsed: ParsedItemRow[] = []
  let skippedRows = 0

  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    if (nameColIndex === -1) {
      skippedRows++
      continue
    }
    const name = (cells[nameColIndex] ?? '').trim()
    if (!name) {
      skippedRows++
      continue
    }

    const row: ParsedItemRow = { name }
    for (let c = 0; c < cells.length; c++) {
      const col = colByIndex[c]
      if (!col || col.key === 'name') continue
      const raw = cells[c] ?? ''
      if (raw.trim() === '') continue
      if (col.kind === 'number') {
        const n = parseNumber(raw)
        if (n !== undefined) (row as unknown as Record<string, number>)[col.key] = n
      } else {
        ;(row as unknown as Record<string, string>)[col.key] = raw.trim()
      }
    }
    parsed.push(row)
  }

  return { rows: parsed, skippedRows, unmatchedHeaders: [...new Set(unmatchedHeaders)] }
}
