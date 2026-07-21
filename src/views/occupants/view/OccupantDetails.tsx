'use client'

// React Imports
import { useState } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'

// Component Imports
import OccupantDetailHeader from './OccupantDetailHeader'
import CustomTabList from '@core/components/mui/TabList'
import ProfileInformationTab from '@/views/tenants/view/ProfileInformationTab'
import HomeDetailsTab from '@/views/tenants/view/HomeDetailsTab'
import PaymentHistoryTab from '@/views/tenants/view/PaymentHistoryTab'
import DocumentationTab from '@/views/tenants/view/DocumentationTab'
import GuarantorTab from './GuarantorTab'
import NoticesTab from './NoticesTab'
import ViolationsTab from './ViolationsTab'
import type { Unit } from '@/types/property'

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

const unitStatusColor: Record<Unit['status'], 'success' | 'warning' | 'error' | 'info'> = {
  occupied: 'success',
  available: 'warning',
  maintenance: 'error',
  reserved: 'info'
}

function formatUnitRent(unit: Unit): string {
  const currency = unit.currency || 'GHS'

  return `${currency} ${unit.rent.toLocaleString()}`
}

const OccupantDetails = ({
  tenantData,
  tenantId,
  occupiedUnits = []
}: {
  tenantData?: OccupantData
  tenantId: string
  occupiedUnits?: Unit[]
}) => {
  const [activeTab, setActiveTab] = useState('profile')

  const handleChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  const tabContentList: { [key: string]: ReactElement } = {
    profile: <ProfileInformationTab tenantData={tenantData} />,
    home: <HomeDetailsTab tenantData={tenantData} />,
    guarantor: <GuarantorTab occupantId={tenantId} />,
    payment: <PaymentHistoryTab occupantId={tenantId} />,
    documentation: <DocumentationTab occupantId={tenantId} />,
    notices: <NoticesTab occupantId={tenantId} />,
    violations: <ViolationsTab occupantId={tenantId} />
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <OccupantDetailHeader tenantData={tenantData} tenantId={tenantId} />
      </Grid>
      {occupiedUnits.length > 0 && (
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader title='Units occupied' />
            <CardContent className='flex flex-col gap-4'>
              {occupiedUnits.map((unit, index) => (
                <div key={unit.id}>
                  <Grid container spacing={4} alignItems='center'>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant='body2' color='text.secondary'>
                        Unit No
                      </Typography>
                      <Typography variant='h6'>{unit.unitNo || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant='body2' color='text.secondary'>
                        Property
                      </Typography>
                      <Typography variant='h6'>{unit.propertyName || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant='body2' color='text.secondary'>
                        Rent
                      </Typography>
                      <Typography variant='h6'>{formatUnitRent(unit)}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <Typography variant='body2' color='text.secondary'>
                        Status
                      </Typography>
                      <Chip
                        variant='tonal'
                        label={unit.status}
                        color={unitStatusColor[unit.status] ?? 'info'}
                        size='small'
                        className='capitalize w-fit'
                      />
                    </Grid>
                  </Grid>
                  {index < occupiedUnits.length - 1 && <Divider className='mt-4' />}
                </div>
              ))}
            </CardContent>
          </Card>
        </Grid>
      )}
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
            <Tab
              icon={<i className='ri-mail-line' />}
              value='notices'
              label='Notices'
              iconPosition='start'
            />
            <Tab
              icon={<i className='ri-error-warning-line' />}
              value='violations'
              label='Violations'
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
