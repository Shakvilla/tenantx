/**
 * Maintenance Request types — mirrors backend MaintenanceRequestDto.Response
 */
export type MaintenanceRequestType = {
  id: string
  requestNumber?: string | null
  title: string
  description: string
  categoryId?: string | null
  subCategory?: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'NEW' | 'PENDING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | 'REJECTED'
  propertyId?: string | null
  unitId?: string | null
  occupantId?: string | null
  maintainerId?: string | null
  requestedBy?: string | null
  assignedTo?: string | null
  approvedBy?: string | null
  scheduledDate?: string | null
  targetResolutionDate?: string | null
  completedDate?: string | null
  isSlaBreached?: boolean
  permissionToEnter?: boolean
  entryInstructions?: string | null
  preferredTimeSlots?: string[]
  estimatedCost?: number | null
  actualCost?: number | null
  billableTo?: string | null
  currency?: string | null
  images?: string[]
  notes?: string | null
  version?: number
  createdAt: string
  updatedAt: string
}

export type MaintenanceRequestStats = {
  total: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  slaBreached: number
  avgResolutionTimeHours: number
  openRequests: number
  completedThisMonth: number
}
