export type MaintainerType = {
  id: number
  name: string
  email: string
  phone: string
  avatar?: string
  specialization: string
  status: 'active' | 'inactive'
  address?: string
  rating?: number
  totalJobs?: number
  completedJobs?: number
}

