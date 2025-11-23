// Type Imports
import type { ThemeColor } from '@core/types'

export type CustomerType = {
  id: number
  name: string
  phoneNumber: string
  ussdCode: string
  status: 'active' | 'suspend' | 'inactive'
  agent?: string
  rate?: number
  registrationDate: string
  avatar?: string
  avatarColor?: ThemeColor
}

