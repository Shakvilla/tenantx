/**
 * Maintainer types — mirrors backend MaintainerDto.Response
 */
export type MaintainerType = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  companyName?: string | null
  specializations?: string[]
  status: string
  rating?: number | null
  totalJobs?: number
  completedJobs?: number
  insuranceExpiryDate?: string | null
  taxId?: string | null
  isCompliant?: boolean
  createdAt: string
  updatedAt: string
}
