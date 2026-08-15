export type ExpenseConfigType = {
  id: string
  item: string
  category?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string | null
}
