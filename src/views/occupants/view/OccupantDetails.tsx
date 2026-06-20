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
import OccupantDetailHeader from './OccupantDetailHeader'
import CustomTabList from '@core/components/mui/TabList'
import ProfileInformationTab from '@/views/tenants/view/ProfileInformationTab'
import HomeDetailsTab from '@/views/tenants/view/HomeDetailsTab'
import PaymentHistoryTab from '@/views/tenants/view/PaymentHistoryTab'
import DocumentationTab from '@/views/tenants/view/DocumentationTab'
import GuarantorTab from './GuarantorTab'

type OccupantData = {
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
  unitId?: string
  propertyId?: string
  ghanaCardId?: string
  idType?: string
  idCardFrontUrl?: string
  idCardBackUrl?: string
  securityDeposit?: string
  lateFee?: string
  rentType?: string
  receipt?: string
  paymentDueDate?: string
}

const OccupantDetails = ({
  tenantData,
  tenantId
}: {
  tenantData?: OccupantData
  tenantId: string
}) => {
  const [activeTab, setActiveTab] = useState('profile')

  const handleChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  const tabContentList: { [key: string]: ReactElement } = {
    profile: <ProfileInformationTab tenantData={tenantData} />,
    home: <HomeDetailsTab tenantData={tenantData} />,
    guarantor: <GuarantorTab occupantId={tenantId} />,
    payment: <PaymentHistoryTab />,
    documentation: <DocumentationTab />
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <OccupantDetailHeader tenantData={tenantData} tenantId={tenantId} />
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
            <Tab icon={<i className='ri-home-line' />} value='home' label='Home Details' iconPosition='start' />
            <Tab
              icon={<i className='ri-shield-user-line' />}
              value='guarantor'
              label='Guarantor'
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

export default OccupantDetails
