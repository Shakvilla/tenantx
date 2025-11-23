// Type Imports
import type { ThemeColor } from '@core/types'

export type AgentType = {
  id: number
  name: string
  phoneNumber: string
  customersAssigned: number
  status: 'active' | 'suspend' | 'inactive'
  userType: 'agent'
  registrationDate: string
  avatar?: string
  avatarColor?: ThemeColor
}

