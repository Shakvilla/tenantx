'use client'

import { useState } from 'react'

// MUI Imports
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'

// Component Imports
import UnitDetailHeader  from './UnitDetailHeader'
import UnitInfoCard      from './UnitInfoCard'
import UnitImagesCard    from './UnitImagesCard'
import UnitAmenitiesCard from './UnitAmenitiesCard'
import InspectionsTab    from './InspectionsTab'
import VacateTab         from './VacateTab'
import AdvertiseUnitCard from './AdvertiseUnitCard'

// Type Imports
import type { Property } from '@/types/property'

type UnitViewData = {
  id: string
  unitNumber: string
  propertyName: string
  propertyId: string
  tenantName: string | null
  status: 'occupied' | 'vacant' | 'maintenance' | 'available' | 'reserved'
  rent: string
  rentPeriod: string
  bedrooms: number
  bathrooms: number
  size: string
  floor: number | null
  type: string
  images: string[]
  amenities: string[]
  features: Record<string, any>
  metadata: Record<string, any>
}

const UnitDetails = ({
  unitData,
  unitId,
  properties = []
}: {
  unitData?: UnitViewData
  unitId: string
  properties?: Property[]
}) => {
  const [tab, setTab] = useState('overview')

  return (
    <Box>
      {/* Header sits above the tabs — always visible */}
      <Box sx={{ mb: 4 }}>
        <UnitDetailHeader unitData={unitData} unitId={unitId} properties={properties} />
      </Box>

      <TabContext value={tab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
          <TabList onChange={(_, v) => setTab(v)} aria-label='unit detail tabs'>
            <Tab
              value='overview'
              label='Overview'
              icon={<i className='ri-home-4-line' />}
              iconPosition='start'
            />
            <Tab
              value='inspections'
              label='Inspections'
              icon={<i className='ri-file-list-3-line' />}
              iconPosition='start'
            />
            <Tab
              value='vacate'
              label='Vacate'
              icon={<i className='ri-door-open-line' />}
              iconPosition='start'
            />
          </TabList>
        </Box>

        {/* ── Overview ─────────────────────────────────────────────────── */}
        <TabPanel value='overview' className='p-0'>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12 }}>
                  <UnitImagesCard unitData={unitData} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <UnitInfoCard unitData={unitData} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <UnitAmenitiesCard unitData={unitData} />
                </Grid>
              </Grid>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12 }}>
                  <AdvertiseUnitCard
                    unitId={unitId}
                    unitNo={unitData?.unitNumber}
                    propertyName={unitData?.propertyName}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        {/* ── Inspections ──────────────────────────────────────────────── */}
        <TabPanel value='inspections' className='p-0'>
          <InspectionsTab
            unitId={unitId}
            propertyId={unitData?.propertyId ?? ''}
            unitNo={unitData?.unitNumber}
            propertyName={unitData?.propertyName}
          />
        </TabPanel>

        {/* ── Vacate ───────────────────────────────────────────────────── */}
        <TabPanel value='vacate' className='p-0'>
          <VacateTab
            unitId={unitId}
            propertyId={unitData?.propertyId ?? ''}
            unitNo={unitData?.unitNumber}
            propertyName={unitData?.propertyName}
            tenantName={unitData?.tenantName ?? undefined}
          />
        </TabPanel>
      </TabContext>
    </Box>
  )
}

export default UnitDetails
