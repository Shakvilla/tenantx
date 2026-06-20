'use client'

// React Imports
import { useState } from 'react'

import { useRouter } from 'next/navigation'

// MUI Imports
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'

// API Imports
import { deleteOccupant } from '@/lib/api/occupants'
import { getStoredTenantId } from '@/lib/api/storage'

type OccupantData = {
  id: string
  name: string
  email: string
  phone: string
  roomNo: string
  propertyName: string
  status: 'active' | 'inactive'
  avatar?: string
}

const OccupantDetailHeader = ({
  tenantData,
  tenantId
}: {
  tenantData?: OccupantData
  tenantId: string
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const router = useRouter()

  const statusColor = tenantData?.status === 'active' ? 'success' : 'warning'

  const handleDelete = async () => {
    const storedTenantId = getStoredTenantId()

    if (!storedTenantId) {
      setDeleteError('No tenant ID found')

      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteOccupant(storedTenantId, tenantId)
      setDeleteDialogOpen(false)
      router.push('/occupants')
    } catch (error) {
      console.error('Failed to delete occupant:', error)
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete occupant')
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className='flex flex-wrap justify-between sm:items-center max-sm:flex-col gap-y-4'>
        <div className='flex flex-col items-start gap-2'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Typography variant='h4'>{tenantData?.name || `Occupant #${tenantId}`}</Typography>
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
            {tenantData?.roomNo && <Chip variant='tonal' label={tenantData.roomNo} color='info' size='small' />}
          </div>
          <Typography variant='body2' color='text.secondary'>
            {tenantData?.email || 'Email not available'}
          </Typography>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outlined'
            color='error'
            startIcon={
              isDeleting ? <CircularProgress size={16} color='inherit' /> : <i className='ri-delete-bin-line' />
            }
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Occupant'}
          </Button>
        </div>
      </div>
      {deleteError && (
        <Typography variant='body2' color='error' className='mt-2'>
          {deleteError}
        </Typography>
      )}
      <ConfirmationDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        type='delete-unit'
        onConfirm={handleDelete}
      />
    </>
  )
}

export default OccupantDetailHeader
