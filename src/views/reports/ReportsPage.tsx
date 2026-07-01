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
import GraComplianceReport from './GraComplianceReport'
import ArrearsReport from './ArrearsReport'
import CashFlowReport from './CashFlowReport'
import { FeatureGate } from '@/components/subscription/FeatureGate'
import { useFeature } from '@/hooks/useFeature'

// Type Imports
import type { DateRange } from '@/types/reports/reportTypes'

// Util Imports
import { getDateRangeFromPreset } from '@/utils/reports/dateUtils'

/** Small lock icon shown on tab labels when the underlying feature is locked */
const LockIcon = () => (
  <i className='ri-lock-line' style={{ fontSize: '0.7rem', opacity: 0.45, marginLeft: 4 }} />
)

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState<string>('tenants')
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeFromPreset('last30days'))

  const hasAdvancedReports  = useFeature('ADVANCED_REPORTS')
  const hasFinancialReports = useFeature('FINANCIAL_REPORTS')

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
                <Tab
                  value='tenants'
                  iconPosition='start'
                  icon={<i className='ri-group-line' />}
                  label={<span>Tenants {!hasAdvancedReports && <LockIcon />}</span>}
                />
                <Tab
                  value='expenses'
                  iconPosition='start'
                  icon={<i className='ri-money-dollar-circle-line' />}
                  label={<span>Expenses {!hasAdvancedReports && <LockIcon />}</span>}
                />
                <Tab
                  value='earnings'
                  iconPosition='start'
                  icon={<i className='ri-line-chart-line' />}
                  label={<span>Earnings {!hasFinancialReports && <LockIcon />}</span>}
                />
                <Tab
                  value='maintenance'
                  iconPosition='start'
                  icon={<i className='ri-tools-line' />}
                  label={<span>Maintenance {!hasAdvancedReports && <LockIcon />}</span>}
                />
                <Tab
                  value='gra'
                  iconPosition='start'
                  icon={<i className='ri-government-line' />}
                  label={<span>GRA Compliance {!hasFinancialReports && <LockIcon />}</span>}
                />
                <Tab
                  value='arrears'
                  iconPosition='start'
                  icon={<i className='ri-alarm-warning-line' />}
                  label={<span>Arrears {!hasAdvancedReports && <LockIcon />}</span>}
                />
                <Tab
                  value='cashflow'
                  iconPosition='start'
                  icon={<i className='ri-funds-line' />}
                  label={<span>Cash Flow {!hasAdvancedReports && <LockIcon />}</span>}
                />
              </CustomTabList>

              {/* ── ADVANCED_REPORTS tabs (Basic+) ─────────────────── */}
              <TabPanel value='tenants' className='p-0 mts-6'>
                <FeatureGate feature='ADVANCED_REPORTS'>
                  <TenantsReport dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
                </FeatureGate>
              </TabPanel>

              <TabPanel value='expenses' className='p-0 mts-6'>
                <FeatureGate feature='ADVANCED_REPORTS'>
                  <ExpensesReport dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
                </FeatureGate>
              </TabPanel>

              <TabPanel value='maintenance' className='p-0 mts-6'>
                <FeatureGate feature='ADVANCED_REPORTS'>
                  <MaintenanceReport dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
                </FeatureGate>
              </TabPanel>

              <TabPanel value='arrears' className='p-0 mts-6'>
                <FeatureGate feature='ADVANCED_REPORTS'>
                  <ArrearsReport />
                </FeatureGate>
              </TabPanel>

              <TabPanel value='cashflow' className='p-0 mts-6'>
                {/* CashFlowReport gates itself internally — no outer FeatureGate needed */}
                <CashFlowReport />
              </TabPanel>

              {/* ── FINANCIAL_REPORTS tabs (Pro only) ──────────────── */}
              <TabPanel value='earnings' className='p-0 mts-6'>
                <FeatureGate
                  feature='FINANCIAL_REPORTS'
                  lockedMessage='Earnings reports are available on the Pro plan. Upgrade to view revenue, commission, and payout breakdowns.'
                >
                  <EarningsReport dateRange={dateRange} onDateRangeChange={handleDateRangeChange} />
                </FeatureGate>
              </TabPanel>

              <TabPanel value='gra' className='p-0 mts-6'>
                <FeatureGate
                  feature='FINANCIAL_REPORTS'
                  lockedMessage='GRA Compliance reports are available on the Pro plan. Upgrade to generate withholding tax and rental income summaries.'
                >
                  <GraComplianceReport />
                </FeatureGate>
              </TabPanel>
            </TabContext>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ReportsPage
