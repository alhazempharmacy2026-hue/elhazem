import { parseCSV } from './csv'
import type { ParsedSalesRow } from './importSales'

// Handles the pharmacy program's "مبيعات الأصناف" (item sales) print report
// (B-Connect/E-Plus) when exported directly to CSV — the same print-preview-to-CSV
// quirk as the items/stock report: every row bakes the column captions and a
// duplicated page footer into the data line.
//
// Verified against a real 3,581-row export: every row has the same 33 fields, with
// captions "الموظف".."الكود" at fixed indices 7-15, followed by their values at a
// +8 offset (except "الموظف", which has no separate value):
//   [16] إجمالى س.بيع  [17] الرصيد (current stock)  [18] الوحدة  [19] الكمية (sold)
//   [20] المنشأ  [21] الشركة  [22] الإسم  [23] الكود
// The report's own date range sits at fields [1] (to) and [3] (from), letting us
// derive the exact period length instead of asking the owner to type it in.
const LABEL_ROW_MIN_LENGTH = 24

function looksLikeThisFormat(row: string[]): boolean {
  return (
    row.length >= LABEL_ROW_MIN_LENGTH &&
    row[7] === 'الموظف' &&
    row[11] === 'الكمية' &&
    row[14] === 'الإسم' &&
    row[15] === 'الكود'
  )
}

function parseNumber(raw: string): number | undefined {
  const cleaned = raw.replace(/[,\s]/g, '')
  if (cleaned === '' || cleaned === '-') return undefined
  const n = Number(cleaned)
  return isNaN(n) ? undefined : n
}

// "2026/08/31 23:59" -> Date
function parseReportDate(raw: string): Date | null {
  const m = raw.trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})/)
  if (!m) return null
  const [, y, mo, d, h, mi] = m
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi))
  return isNaN(date.getTime()) ? null : date
}

export interface PharmacySalesReportResult {
  rows: ParsedSalesRow[]
  periodDays: number | null
}

// Returns null when the file doesn't match this specific report format, so the
// caller can fall back to generic two-column CSV parsing.
export function parsePharmacySalesReport(text: string): PharmacySalesReportResult | null {
  const rows = parseCSV(text)
  if (rows.length === 0 || !looksLikeThisFormat(rows[0])) return null

  const toDate = parseReportDate(rows[0][1] ?? '')
  const fromDate = parseReportDate(rows[0][3] ?? '')
  let periodDays: number | null = null
  if (toDate && fromDate) {
    const days = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
    if (days > 0) periodDays = Math.round(days)
  }

  const parsed: ParsedSalesRow[] = []
  for (const row of rows) {
    if (!looksLikeThisFormat(row)) continue
    const name = (row[22] ?? '').trim()
    const quantitySold = parseNumber(row[19] ?? '')
    if (!name || quantitySold === undefined) continue
    parsed.push({ name, code: (row[23] ?? '').trim() || undefined, quantitySold })
  }

  return { rows: parsed, periodDays }
}
