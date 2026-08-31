export interface SalesColumnDef {
  key: 'name' | 'code' | 'quantitySold'
  label: string
  kind: 'number' | 'text'
}

// Matches the pharmacy program's "item sales report" (تقرير مبيعات الأصناف) export:
// item name/code plus the total quantity sold over the report's date range.
export const SALES_COLUMNS: SalesColumnDef[] = [
  { key: 'name', label: 'اسم الصنف', kind: 'text' },
  { key: 'code', label: 'الكود', kind: 'text' },
  { key: 'quantitySold', label: 'الكمية المباعة', kind: 'number' },
]
