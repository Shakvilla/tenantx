export type ExpenseType = {
  id: number
  item: string
  amount: number
  date: string
  comment: string
  propertyName?: string
  propertyImage?: string
  unitNo?: string
  responsibility?: 'Owner' | 'Tenant'
  status?: 'paid' | 'unpaid' | 'pending'
}

