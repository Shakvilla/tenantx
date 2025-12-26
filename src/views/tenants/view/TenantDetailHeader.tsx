'use client'

// React Imports
import { useState } from 'react'

import { useRouter } from 'next/navigation'

// MUI Imports
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

// Component Imports
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'

type TenantData = {
  id: string
  name: string
  email: string
  phone: string
  roomNo: string
  propertyName: string
  status: 'active' | 'inactive'
  avatar?: string
}

const TenantDetailHeader = ({
  tenantData,
  tenantId
}: {
  tenantData?: TenantData
  tenantId: string
}) => {
  // States
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const router = useRouter()

  const statusColor = tenantData?.status === 'active' ? 'success' : 'warning'

  const handleDelete = () => {
    // TODO: Implement API call to delete tenant
    // For now, just navigate back to tenants list
    router.push('/tenants')
  }

  return (
    <>
      <div className='flex flex-wrap justify-between sm:items-center max-sm:flex-col gap-y-4'>
        <div className='flex flex-col items-start gap-2'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Typography variant='h4'>{tenantData?.name || `Tenant #${tenantId}`}</Typography>
            <Chip
              variant='tonal'
              label={tenantData?.status || '-'}
              color={statusColor}
              size='small'
              className='capitalize'
            />
            {tenantData?.propertyName && (
              <Chip variant='tonal' label={tenantData.propertyName} color='primary' size='small' />
            )}
            {tenantData?.roomNo && (
              <Chip variant='tonal' label={tenantData.roomNo} color='info' size='small' />
            )}
          </div>
          <Typography variant='body2' color='text.secondary'>
            {tenantData?.email || 'Email not available'}
          </Typography>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outlined'
            color='error'
            startIcon={<i className='ri-delete-bin-line' />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Tenant
          </Button>
        </div>
      </div>
      <ConfirmationDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        type='delete-customer'
        onConfirm={handleDelete}
      />
    </>
  )
}

export default TenantDetailHeader

