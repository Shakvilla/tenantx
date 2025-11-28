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
import ActivityTimelineTab from './ActivityTimelineTab'
import PaymentHistoryTab from './PaymentHistoryTab'

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
}

const TenantHistoryDetails = ({ tenantData, tenantId }: { tenantData?: TenantData; tenantId: string }) => {
  // States
  const [activeTab, setActiveTab] = useState('activity')

  const handleChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  // Tab content list
  const tabContentList: { [key: string]: ReactElement } = {
    activity: <ActivityTimelineTab tenantId={tenantId} />,
    payment: <PaymentHistoryTab />
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
              icon={<i className='ri-time-line' />}
              value='activity'
              label='Activity Timeline'
              iconPosition='start'
            />
            <Tab
              icon={<i className='ri-money-dollar-circle-line' />}
              value='payment'
              label='Payment History'
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

export default TenantHistoryDetails

