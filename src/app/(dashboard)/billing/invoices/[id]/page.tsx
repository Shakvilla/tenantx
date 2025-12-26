'use client'

// React Imports
import { useState } from 'react'

import { useParams } from 'next/navigation'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import ViewInvoiceCard from '@/views/billing/view/ViewInvoiceCard'
import ViewInvoiceActions from '@/views/billing/view/ViewInvoiceActions'

// Print styles are handled in globals.css

const ViewInvoicePage = () => {
  const params = useParams()
  const invoiceId = params.id as string

  // Type for invoice data - matches ViewInvoiceActions
  type InvoiceData = {
    id: number
    invoiceNumber: string
    tenantName: string
    tenantEmail: string
    tenantAvatar?: string
    propertyName: string
    unitName: string
    amount: string
    issuedDate: string
    dueDate: string
    status: 'paid' | 'pending' | 'overdue' | 'draft' | 'cancelled'
    balance: string
    invoiceMonth?: string
    invoiceType?: string
    description?: string
    invoiceItems?: Array<{
      id: number
      description: string
      quantity: number
      price: number
    }>
  }

  // Sample data - TODO: Fetch from API
  const [invoicesData, setInvoicesData] = useState<InvoiceData[]>([
    {
      id: parseInt(invoiceId),
      invoiceNumber: 'INV-2024-001',
      tenantName: 'John Doe',
      tenantEmail: 'john.doe@example.com',
      tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
      propertyName: 'Beautiful modern style luxury home exterior at sunset',
      unitName: 'Unit 101',
      amount: '₵1,450',
      issuedDate: '2024-01-15',
      dueDate: '2024-02-15',
      status: 'pending',
      balance: '₵1,450',
      invoiceMonth: '01/2024',
      invoiceType: 'Rent',
      description: 'Monthly rent payment for Unit 101',
      invoiceItems: [
        {
          id: 1,
          description: 'Monthly Rent',
          quantity: 1,
          price: 1450
        },
        {
          id: 2,
          description: 'Maintenance Fee',
          quantity: 1,
          price: 50
        }
      ]
    }
  ])

  const invoiceData = invoicesData.find(inv => inv.id === parseInt(invoiceId)) || invoicesData[0]

  // Sample data for dropdowns - TODO: Fetch from API
  const properties = [
    { id: 1, name: 'Beautiful modern style luxury home exterior at sunset' },
    { id: 2, name: 'Property 2' }
  ]

  const units = [
    { id: 1, unitNumber: 'Unit 101', propertyId: '1', propertyName: 'Beautiful modern style luxury home exterior at sunset' },
    { id: 2, unitNumber: 'Unit 102', propertyId: '1', propertyName: 'Beautiful modern style luxury home exterior at sunset' }
  ]

  const tenants = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@example.com',
      roomNo: 'Unit 101',
      propertyName: 'Beautiful modern style luxury home exterior at sunset',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3'
    }
  ]

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
          invoicesData={invoicesData}
          setData={setInvoicesData}
        />
      </Grid>
    </Grid>
  )
}

export default ViewInvoicePage

