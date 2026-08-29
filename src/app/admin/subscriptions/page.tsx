'use client'

import Box from '@mui/material/Box'

import PlanList from '@/views/admin/plans/PlanList'
import TenantSubscriptionsTable from '@/views/admin/plans/TenantSubscriptionsTable'

export default function AdminSubscriptionsPage() {
  return (
    <Box>
      <PlanList />
      <TenantSubscriptionsTable />
    </Box>
  )
}
