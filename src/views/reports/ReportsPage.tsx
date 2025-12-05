// Documentation: /docs/reports/reports-flow.md

'use client'

// React Imports
import { useState, useCallback } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

// Component Imports
import CustomTabList from '@core/components/mui/TabList'
import PageBanner from '@/components/banner/PageBanner'
import TenantsReport from './TenantsReport'
import ExpensesReport from './ExpensesReport'
import EarningsReport from './EarningsReport'
import MaintenanceReport from './MaintenanceReport'

// Type Imports
import type { DateRange } from '@/types/reports/reportTypes'

// Util Imports
import { getDateRangeFromPreset } from '@/utils/reports/dateUtils'

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState<string>('tenants')
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset('last30days'))

  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue)
  }

  const handleDateRangeChange = useCallback((newDateRange: DateRange) => {
    setDateRange(newDateRange)
  }, [])

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <PageBanner
          title='Reports'
          description='Generate comprehensive reports for tenants, expenses, earnings, and maintenance. Filter by date range and export to PDF or Excel.'
          icon='ri-file-chart-line'
        />
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <TabContext value={activeTab}>
              <CustomTabList onChange={handleTabChange} variant='scrollable' scrollButtons='auto'>
                <Tab value='tenants' label='Tenants' icon={<i className='ri-group-line' />} iconPosition='start' />
                <Tab value='expenses' label='Expenses' icon={<i className='ri-money-dollar-circle-line' />} iconPosition='start' />
                <Tab value='earnings' label='Earnings' icon={<i className='ri-line-chart-line' />} iconPosition='start' />
                <Tab value='maintenance' label='Maintenance' icon={<i className='ri-tools-line' />} iconPosition='start' />
              </CustomTabList>

              <TabPanel value='tenants' className='p-0 mts-6'>
                <TenantsReport dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
              </TabPanel>

              <TabPanel value='expenses' className='p-0 mts-6'>
                <ExpensesReport dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
              </TabPanel>

              <TabPanel value='earnings' className='p-0 mts-6'>
                <EarningsReport dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
              </TabPanel>

              <TabPanel value='maintenance' className='p-0 mts-6'>
                <MaintenanceReport dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
              </TabPanel>
            </TabContext>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ReportsPage

