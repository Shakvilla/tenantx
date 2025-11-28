'use client'

// React Imports
import { useState } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'

// Component Imports
import TenantDetailHeader from './TenantDetailHeader'
import CustomTabList from '@core/components/mui/TabList'
import ProfileInformationTab from './ProfileInformationTab'
import HomeDetailsTab from './HomeDetailsTab'

type TenantData = {
  id: string
  name: string
  email: string
  phone: string
  roomNo: string
  propertyName: string
  numberOfUnits: number
  costPerMonth: string
  leasePeriod: string
  totalAmount: string
  status: 'active' | 'inactive'
  avatar?: string
  age?: number
  familyMembers?: number
  job?: string
  previousAddress?: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  permanentAddress?: {
    address: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  propertyImage?: string
  propertyAddress?: string
  unitName?: string
  securityDeposit?: string
  lateFee?: string
  rentType?: string
  receipt?: string
  paymentDueDate?: string
}

const TenantDetails = ({
  tenantData,
  tenantId
}: {
  tenantData?: TenantData
  tenantId: string
}) => {
  // States
  const [activeTab, setActiveTab] = useState('profile')

  const handleChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  // Tab content list
  const tabContentList: { [key: string]: ReactElement } = {
    profile: <ProfileInformationTab tenantData={tenantData} />,
    home: <HomeDetailsTab tenantData={tenantData} />,
    payment: <div>Payment History - Coming soon</div>,
    documentation: <div>Documentation - Coming soon</div>
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <TenantDetailHeader tenantData={tenantData} tenantId={tenantId} />
      </Grid>
      <Grid size={{ xs: 12 }} className='flex flex-col gap-6'>
        <TabContext value={activeTab}>
          <CustomTabList onChange={handleChange} variant='scrollable' pill='true'>
            <Tab
              icon={<i className='ri-user-3-line' />}
              value='profile'
              label='Profile Information'
              iconPosition='start'
            />
            <Tab
              icon={<i className='ri-home-line' />}
              value='home'
              label='Home Details'
              iconPosition='start'
            />
            <Tab
              icon={<i className='ri-money-dollar-circle-line' />}
              value='payment'
              label='Payment History'
              iconPosition='start'
            />
            <Tab
              icon={<i className='ri-file-text-line' />}
              value='documentation'
              label='Documentation'
              iconPosition='start'
            />
          </CustomTabList>

          <TabPanel value={activeTab} className='p-0'>
            {tabContentList[activeTab]}
          </TabPanel>
        </TabContext>
      </Grid>
    </Grid>
  )
}

export default TenantDetails

