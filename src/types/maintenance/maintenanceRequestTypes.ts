export type MaintenanceRequestType = {
  id: number
  propertyName: string
  propertyImage?: string
  unitNo: string
  tenantName: string
  tenantAvatar?: string
  issue: string
  description?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'new' | 'pending' | 'in-progress' | 'completed' | 'rejected'
  assignedTo?: string
  assignedToAvatar?: string
  requestedDate: string
  completedDate?: string
  images?: string[]
}

