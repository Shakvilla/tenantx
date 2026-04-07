// Next.js Imports
import { cookies } from 'next/headers'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Alert from '@mui/material/Alert'

// Component Imports
import ViewInvoiceCard from '@/views/billing/view/ViewInvoiceCard'
import ViewInvoiceActions from '@/views/billing/view/ViewInvoiceActions'

// API Imports
import { getInvoiceById } from '@/lib/api/invoices'
import { getProperties } from '@/lib/api/properties'
import { getAllUnits } from '@/lib/api/units'
import { getTenants } from '@/lib/api/tenants'

type Props = {
  params: Promise<{ id: string }>
}

const ViewInvoicePage = async (props: Props) => {
  const params = await props.params
  const invoiceId = params.id
  
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('tenant_id')?.value

  if (!tenantId) {
    return <Alert severity="error">Unauthenticated / No Tenant Selected</Alert>
  }

  try {
    // Fetch data concurrently to avoid waterfalls
    const [invoiceRes, propertiesRes, unitsRes, tenantsRes] = await Promise.all([
      getInvoiceById(tenantId, invoiceId),
      getProperties(tenantId, { size: 100 }),
      getAllUnits(tenantId, { size: 100 }),
      getTenants(tenantId, { pageSize: 100 })
    ])

    if (!invoiceRes.success || !invoiceRes.data) {
      return <Alert severity="warning">Invoice not found</Alert>
    }

    const invoiceData = invoiceRes.data
    const properties = propertiesRes.data.map(p => ({ id: parseInt(p.id), name: p.name }))
    
    const units = unitsRes.data.map(u => ({
      id: parseInt(u.id),
      unitNumber: u.unitNo,
      propertyId: u.propertyId,
      propertyName: u.property?.name || ''
    }))

    const tenants = tenantsRes.data.map(t => ({
      id: parseInt(t.id),
      name: `${t.first_name} ${t.last_name}`,
      email: t.email,
      roomNo: t.unit_no || '',
      propertyName: t.property?.name || '',
      avatar: t.avatar || undefined
    }))

    return (
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 9 }}>
          <ViewInvoiceCard invoiceData={invoiceData} invoiceId={invoiceId} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <ViewInvoiceActions
            invoiceId={invoiceId}
            invoiceData={invoiceData}
            properties={properties}
            units={units}
            tenants={tenants}
            invoicesData={[invoiceData]}
          />
        </Grid>
      </Grid>
    )
  } catch (error) {
    console.error('Failed to load invoice page:', error)
    
    return <Alert severity="error">Failed to load invoice data</Alert>
  }
}

export default ViewInvoicePage
