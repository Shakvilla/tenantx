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
  rawBedrooms?: number
  rawBathrooms?: number
  rawRooms?: number
  amenities?: Record<string, boolean>
  images?: string[]
  imageFileIds?: string[]
  thumbnailIndex?: number | null
  status?: string
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
        status: propertyData.status,
        type: propertyData.type,
        condition: propertyData.condition,
        region: propertyData.region,
        district: propertyData.district,
        city: propertyData.city,
        gpsCode: propertyData.gpsCode,
        description: propertyData.description,

        // The stored counts, not the page's display strings — the dialog maps
        // them onto its options itself, and needs the exact number to tell an
        // 8-bedroom property from the "6+" bucket it prefills into.
        bedrooms: propertyData.rawBedrooms,
        bathrooms: propertyData.rawBathrooms,
        rooms: propertyData.rawRooms,
        amenities: propertyData.amenities,
        images: propertyData.images,

        // Paired positionally with `images`; dropping it orphans the files on
        // ImageKit when the property is later edited or deleted.
        imageFileIds: propertyData.imageFileIds,
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

      // Rethrow: ConfirmationDialog awaits this and shows the server's own
      // reason. The alert this replaces threw that reason away and said "Please
      // try again" — advice that cannot work when the delete was refused
      // because the property still has an active occupant.
      throw error instanceof Error ? error : new Error('Failed to delete property')
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
