import { parseCSV } from './csv'
import type { ParsedItemRow } from './importItems'

// Handles the pharmacy program's "كميات أصناف الصيدلية بالوحدة الكبرى" print report
// (B-Connect / E-Plus) when exported directly to CSV. It isn't a normal spreadsheet:
// exporting the print preview bakes the column captions AND a duplicated page footer
// into every single data line, so there's no one header row to match against.
//
// Verified against a real 8,372-item export: every row has the same 43 fields, with
// the captions "الصيدلية".."الكود" sitting at fixed indices 3-13, immediately followed
// by their values in the same order (offset +10) — except "الصيدلية" itself, which has
// no separate value. That leaves, per row:
//   [14] نسبة  [15] إجمالى البيع  [16] إجمالى التكلفة  [17] س.البيع  [18] م.التكلفة
//   [19] الكمية  [20] الوحدة  [21] الشركة  [22] الإسم  [23] الكود
const LABEL_ROW_MIN_LENGTH = 24

function looksLikeThisFormat(row: string[]): boolean {
  return (
    row.length >= LABEL_ROW_MIN_LENGTH &&
    row[3] === 'الصيدلية' &&
    row[9] === 'الكمية' &&
    row[10] === 'الوحدة' &&
    row[12] === 'الإسم' &&
    row[13] === 'الكود'
  )
}

function parseNumber(raw: string): number | undefined {
  const cleaned = raw.replace(/[,\s%]/g, '')
  if (cleaned === '' || cleaned === '-') return undefined
  const n = Number(cleaned)
  return isNaN(n) ? undefined : n
}

// Returns null when the file doesn't match this specific report format, so the
// caller can fall back to generic header-based CSV parsing.
export function parsePharmacyItemsReport(text: string): ParsedItemRow[] | null {
  const rows = parseCSV(text)
  if (rows.length === 0 || !looksLikeThisFormat(rows[0])) return null

  const parsed: ParsedItemRow[] = []
  for (const row of rows) {
    if (!looksLikeThisFormat(row)) continue
    const name = (row[22] ?? '').trim()
    if (!name) continue
    parsed.push({
      name,
      code: (row[23] ?? '').trim() || undefined,
      unit: (row[20] ?? '').trim() || undefined,
      category: (row[21] ?? '').trim() || undefined, // اسم الشركة المصنعة
      currentStock: parseNumber(row[19] ?? '') ?? 0,
      purchasePrice: parseNumber(row[18] ?? ''),
      salePrice: parseNumber(row[17] ?? ''),
    })
  }
  return parsed
}
