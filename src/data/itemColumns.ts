export interface ItemColumnDef {
  key: 'name' | 'code' | 'unit' | 'category' | 'currentStock' | 'minStock' | 'purchasePrice' | 'salePrice' | 'supplierName'
  label: string
  kind: 'number' | 'text'
}

// Import matches by Arabic header text, so column order in an uploaded file doesn't matter.
export const ITEM_COLUMNS: ItemColumnDef[] = [
  { key: 'name', label: 'اسم الصنف', kind: 'text' },
  { key: 'code', label: 'الكود', kind: 'text' },
  { key: 'unit', label: 'الوحدة', kind: 'text' },
  { key: 'category', label: 'التصنيف', kind: 'text' },
  { key: 'currentStock', label: 'الكمية الحالية', kind: 'number' },
  { key: 'minStock', label: 'حد الطلب الأدنى', kind: 'number' },
  { key: 'purchasePrice', label: 'سعر الشراء', kind: 'number' },
  { key: 'salePrice', label: 'سعر البيع', kind: 'number' },
  { key: 'supplierName', label: 'المورد', kind: 'text' },
]
