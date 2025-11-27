'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import type { ButtonProps } from '@mui/material/Button'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import OpenDialogOnElementClick from '@components/dialogs/OpenDialogOnElementClick'
import AddPropertyDialog from '../AddPropertyDialog'

type PropertyData = {
  id: string
  name: string
  type: string
  stock: boolean
  condition: string
  address?: string
  region?: string
  district?: string
  city?: string
  gpsCode?: string
  description?: string
  bedrooms?: number
  bathrooms?: number
  rooms?: number
  amenities?: Record<string, boolean>
  images?: string[]
  thumbnailIndex?: number | null
  price?: string
}

const PropertyDetailHeader = ({
  propertyData,
  propertyId
}: {
  propertyData?: PropertyData
  propertyId: string
}) => {
  // States
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Vars
  const buttonProps = (children: string, color: ThemeColor, variant: ButtonProps['variant']): ButtonProps => ({
    children,
    color,
    variant
  })

  const stockStatus = propertyData?.stock ? 'In Stock' : 'Out of Stock'
  const stockColor: ThemeColor = propertyData?.stock ? 'success' : 'error'

  // Prepare edit data
  const editData = propertyData
    ? {
        id: propertyData.id,
        name: propertyData.name,
        type: propertyData.type,
        condition: propertyData.condition,
        region: propertyData.region,
        district: propertyData.district,
        city: propertyData.city,
        gpsCode: propertyData.gpsCode,
        description: propertyData.description,
        bedrooms: propertyData.bedrooms,
        bathrooms: propertyData.bathrooms,
        rooms: propertyData.rooms,
        amenities: propertyData.amenities,
        images: propertyData.images,
        thumbnailIndex: propertyData.thumbnailIndex,
        price: propertyData.price,
        address: propertyData.address
      }
    : null

  return (
    <>
      <div className='flex flex-wrap justify-between sm:items-center max-sm:flex-col gap-y-4'>
        <div className='flex flex-col items-start gap-2'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Typography variant='h4'>{propertyData?.name || `Property #${propertyId}`}</Typography>
            <Chip variant='tonal' label={propertyData?.type || '-'} color='primary' size='small' />
            <Chip variant='tonal' label={stockStatus} color={stockColor} size='small' />
            {propertyData?.condition && (
              <Chip variant='tonal' label={propertyData.condition} color='info' size='small' />
            )}
          </div>
          <Typography variant='body2' color='text.secondary'>
            {propertyData?.address || 'Address not available'}
          </Typography>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outlined'
            color='primary'
            startIcon={<i className='ri-edit-line' />}
            onClick={() => setEditDialogOpen(true)}
          >
            Edit Property
          </Button>
          <OpenDialogOnElementClick
            element={Button}
            elementProps={buttonProps('Delete Property', 'error', 'outlined')}
            dialog={ConfirmationDialog}
            dialogProps={{ type: 'delete-property' }}
          />
        </div>
      </div>
      <AddPropertyDialog
        open={editDialogOpen}
        handleClose={() => setEditDialogOpen(false)}
        editData={editData}
        mode='edit'
        propertyData={[]}
        setData={() => {}}
      />
    </>
  )
}

export default PropertyDetailHeader

