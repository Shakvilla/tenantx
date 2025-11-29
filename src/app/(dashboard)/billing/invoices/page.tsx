'use client'

// Component Imports
import PageBanner from '@components/banner/PageBanner'
import BillingStatsCard from '@/views/billing/BillingStatsCard'
import InvoicesListTable from '@/views/billing/InvoicesListTable'

const InvoicesPage = () => {
  return (
    <>
      <PageBanner
        title='All Invoices'
        description='View and manage all invoices for your properties and tenants'
      />
      <BillingStatsCard />
      <InvoicesListTable />
    </>
  )
}

export default InvoicesPage

