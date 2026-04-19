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
import AddPropertyDialog from '../AddPropertyDialog'

// API Imports
import { deleteProperty } from '@/lib/api/properties'
import { getStoredTenantId } from '@/lib/api/storage'

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
  bedrooms?: string
  bathrooms?: string
  rooms?: string
  amenities?: Record<string, boolean>
  images?: string[]
  thumbnailIndex?: number | null
  price?: string
  ownership?: string
  totalUnits?: number
  occupiedUnits?: number
  purchasePrice?: number
  currentValue?: number
  currency?: string
  street?: string
  zip?: string
  rawType?: string
  rawCondition?: string
  rawRegion?: string
  rawDistrict?: string
}

const PropertyDetailHeader = ({ propertyData, propertyId }: { propertyData?: PropertyData; propertyId: string }) => {
  // States
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const _statusColor = propertyData?.stock ? 'success' : 'error'

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
        address: propertyData.address,

        // Raw backend fields for payload
        ownership: propertyData.ownership,
        totalUnits: propertyData.totalUnits,
        occupiedUnits: propertyData.occupiedUnits,
        purchasePrice: propertyData.purchasePrice,
        currentValue: propertyData.currentValue,
        currency: propertyData.currency,
        street: propertyData.street,
        zip: propertyData.zip,
        rawType: propertyData.rawType,
        rawCondition: propertyData.rawCondition,
        rawRegion: propertyData.rawRegion,
        rawDistrict: propertyData.rawDistrict
      }
    : null

  const handleDelete = async () => {
    try {
      const tenantId = getStoredTenantId()

      if (!tenantId) {
        console.error('Tenant ID not found')

        return
      }

      setIsDeleting(true)

      await deleteProperty(tenantId, propertyId)

      setDeleteDialogOpen(false)

      // Redirect back to properties list
      router.push('/properties')
    } catch (error) {
      console.error('Failed to delete property:', error)

      // In a real app we'd show a toast here
      alert('Failed to delete property. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <div className='flex flex-wrap justify-between sm:items-center max-sm:flex-col gap-y-4'>
        <div className='flex flex-col items-start gap-2'>
          <div className='flex items-center gap-2 flex-wrap'>
            <Typography variant='h4'>{propertyData?.name || `Property #${propertyId}`}</Typography>
            <Chip
              variant='tonal'
              label={propertyData?.stock ? 'Active' : 'Maintenance'}
              color={stockColor}
              size='small'
              className='capitalize'
            />
            <Chip
              variant='tonal'
              label={propertyData?.type || '-'}
              color='primary'
              size='small'
              className='capitalize'
            />
          </div>
          <Typography variant='body2' color='text.secondary'>
            {propertyData?.address || 'Address not available'}
          </Typography>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outlined' color='secondary' onClick={() => setEditDialogOpen(true)}>
            Edit Property
          </Button>
          <Button variant='outlined' color='error' onClick={() => setDeleteDialogOpen(true)}>
            Delete Property
          </Button>
        </div>
      </div>

      <AddPropertyDialog
        open={editDialogOpen}
        handleClose={() => setEditDialogOpen(false)}
        mode='edit'
        editData={editData}
        setData={() => {}}
      />

      <ConfirmationDialog
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        type='delete-property'
        onConfirm={handleDelete}
      />
    </>
  )
}

export default PropertyDetailHeader
