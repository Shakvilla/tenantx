'use client'

// React Imports
import { useState } from 'react'

import { useRouter } from 'next/navigation'

// MUI Imports
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import AddUnitDialog from '../AddUnitDialog'

type UnitData = {
  id: string
  unitNumber: string
  propertyName: string
  propertyId: string
  tenantName: string | null
  status: 'occupied' | 'vacant' | 'maintenance'
  rent: string
  bedrooms: number
  bathrooms: number
  size: string
}

// Sample properties for edit dialog
const sampleProperties = [
  { id: 1, name: 'Xorla House' },
  { id: 2, name: 'Sunset Apartments' },
  { id: 3, name: 'Green Valley' },
  { id: 4, name: 'Ocean View' },
  { id: 5, name: 'Mountain Heights' }
]

const UnitDetailHeader = ({
  unitData,
  unitId
}: {
  unitData?: UnitData
  unitId: string
}) => {
  // States
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const router = useRouter()

  // Vars
  const statusColor: Record<string, ThemeColor> = {
    occupied: 'success',
    vacant: 'warning',
    maintenance: 'error'
  }

  // Prepare edit data
  const editData = unitData
    ? {
        id: unitData.id,
        unitNumber: unitData.unitNumber,
        propertyId: unitData.propertyId,
        propertyName: unitData.propertyName,
        status: unitData.status,
        rent: unitData.rent,
        bedrooms: unitData.bedrooms,
        bathrooms: unitData.bathrooms,
        size: unitData.size,
        tenantName: unitData.tenantName
      }
    : null

  return (
    <>
      <div className='flex flex-wrap justify-between sm:items-center max-sm:flex-col gap-y-4'>
        <div className='flex flex-col items-start gap-2'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Typography variant='h4'>{unitData?.unitNumber || `Unit #${unitId}`}</Typography>
            <Chip
              variant='tonal'
              label={unitData?.status || '-'}
              color={unitData?.status ? statusColor[unitData.status] : 'default'}
              size='small'
              className='capitalize'
            />
            {unitData?.propertyName && (
              <Chip variant='tonal' label={unitData.propertyName} color='primary' size='small' />
            )}
          </div>
          <Typography variant='body2' color='text.secondary'>
            {unitData?.propertyName || 'Property not available'}
          </Typography>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outlined'
            color='primary'
            startIcon={<i className='ri-edit-line' />}
            onClick={() => setEditDialogOpen(true)}
          >
            Edit Unit
          </Button>
          <Button
            variant='outlined'
            color='error'
            startIcon={<i className='ri-delete-bin-line' />}
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete Unit
          </Button>
        </div>
      </div>
      <AddUnitDialog
        open={editDialogOpen}
        handleClose={() => setEditDialogOpen(false)}
        properties={sampleProperties}
        editData={editData}
        mode='edit'
        unitsData={[]}
        setData={() => {}}
      />
      <ConfirmationDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        type='delete-unit'
        onConfirm={() => {
          // TODO: Implement API call to delete unit
          // For now, just navigate back to units list
          router.push('/properties/units')
        }}
      />
    </>
  )
}

export default UnitDetailHeader

