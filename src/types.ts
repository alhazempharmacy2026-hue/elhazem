export interface Medicine {
  id: string
  name: string
  category: string
  unit: string
  stock: number
  minStock: number
  costPrice: number
  sellPrice: number
  expiryDate: string // ISO date
  supplier: string
}

export interface SaleItem {
  medicineId: string
  name: string
  qty: number
  unitPrice: number
  unitCost: number
}

export interface Sale {
  id: string
  date: string // ISO datetime
  items: SaleItem[]
  total: number
}

export interface PharmacyData {
  medicines: Medicine[]
  sales: Sale[]
}
