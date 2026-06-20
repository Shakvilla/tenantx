export type ExpenseType = {
  id: string
  item: string
  amount: number
  date: string
  description?: string | null
  propertyId?: string | null
  propertyName?: string | null
  propertyImage?: string | null
  unitId?: string | null
  unitNo?: string | null
  expenseConfigId?: string | null
  responsibility?: 'OWNER' | 'TENANT' | null
  status?: 'PAID' | 'UNPAID' | 'PENDING' | null
  currency?: string
  imageUrl?: string | null
  createdAt?: string
  updatedAt?: string | null
}
