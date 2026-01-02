'use client'

// React Imports
import { useState, useEffect } from 'react'

import { useParams } from 'next/navigation'

// MUI Imports
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

// Component Imports
import TenantDetails from '@/views/tenants/view/TenantDetails'

// API Imports
import { getTenantById, type TenantRecord } from '@/lib/api/tenants'

/**
 * Transform API TenantRecord to the format expected by TenantDetails component
 */
function transformTenantData(record: TenantRecord) {
  const fullName = `${record.first_name} ${record.last_name}`
  
  return {
    id: record.id,
    name: fullName,
    email: record.email,
    phone: record.phone,
    roomNo: record.unit_no || record.unit?.unit_no || '-',
    propertyName: record.property?.name || '-',
    numberOfUnits: 1,
    costPerMonth: '-', // TODO: Get from unit data when available
    leasePeriod: '-', // TODO: Calculate from move_in/out dates
    totalAmount: '-', // TODO: Calculate total
    status: (record.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
    avatar: record.avatar || undefined,
    age: undefined, // TODO: Add to tenant record if needed
    familyMembers: undefined, // TODO: Add to tenant record if needed
    job: undefined, // TODO: Add to tenant record if needed
    previousAddress: undefined, // TODO: Add to tenant record if needed
    permanentAddress: undefined, // TODO: Add to tenant record if needed
    propertyImage: undefined, // TODO: Get from property data
    propertyAddress: undefined, // TODO: Get from property data
    unitName: record.unit_no || record.unit?.unit_no || '-',
    securityDeposit: '-', // TODO: Get from unit/lease data
    lateFee: '-', // TODO: Get from lease data
    rentType: 'Monthly',
    receipt: '-',
    paymentDueDate: record.move_in_date 
      ? new Date(record.move_in_date).toLocaleDateString() 
      : '-',
  }
}

const ViewTenantPage = () => {
  const params = useParams()
  const tenantId = params.id as string

  // States for data fetching
  const [tenantData, setTenantData] = useState<ReturnType<typeof transformTenantData> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch tenant data on mount
  useEffect(() => {
    async function fetchTenant() {
      if (!tenantId) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await getTenantById(tenantId)
        
        if (response.success && response.data) {
          setTenantData(transformTenantData(response.data))
        } else {
          setError(response.error?.message || 'Failed to load tenant data')
        }
      } catch (err) {
        console.error('Failed to fetch tenant:', err)
        setError(err instanceof Error ? err.message : 'Failed to load tenant data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTenant()
  }, [tenantId])

  // Loading state
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  // No data state
  if (!tenantData) {
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        Tenant not found
      </Alert>
    )
  }

  return <TenantDetails tenantData={tenantData} tenantId={tenantId} />
}

export default ViewTenantPage
