'use client'

// React Imports
import { useState } from 'react'

// Next.js Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'

// Component Imports
import SendInvoiceDrawer from '@/views/billing/shared/SendInvoiceDrawer'
import AddPaymentDrawer from '@/views/billing/shared/AddPaymentDrawer'
import AddInvoiceDialog from '@/views/billing/AddInvoiceDialog'

// API Imports
import type { Invoice } from '@/lib/api/invoices'

type Props = {
  invoiceId: string
  invoiceData?: Invoice
  onPaymentRecorded?: () => void
}

const ViewInvoiceActions = ({ invoiceId: _invoiceId, invoiceData, onPaymentRecorded }: Props) => {
  const router = useRouter()
  // States
  const [sendDrawerOpen, setSendDrawerOpen] = useState(false)
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Handle Print Button Click
  const handlePrint = () => {
    window.print()
  }

  // Handle Download
  const handleDownload = () => {
    // Create a printable version of the invoice
    const printWindow = window.open('', '_blank')

    if (!printWindow) return

    const invoiceContent = document.querySelector('.previewCard')

    if (!invoiceContent || !invoiceData) return

    // Get computed styles for better rendering
    const styles = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: #262b43;
          background: #fff;
          padding: 40px;
        }
        .invoice-container {
          max-width: 900px;
          margin: 0 auto;
          background: #fff;
        }
        .invoice-header {
          background: #f5f5f9;
          padding: 24px;
          border-radius: 8px;
          margin-bottom: 32px;
        }
        .header-content {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 24px;
        }
        .header-left {
          flex: 1;
          min-width: 250px;
        }
        .header-right {
          flex: 1;
          min-width: 250px;
          text-align: right;
        }
        .invoice-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #262b43;
        }
        .invoice-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .invoice-details p {
          margin: 0;
          font-size: 14px;
          color: #262b43;
        }
        .invoice-info-section {
          display: flex;
          gap: 32px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }
        .invoice-to, .bill-to {
          flex: 1;
          min-width: 250px;
        }
        .section-title {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 16px;
          color: #262b43;
        }
        .tenant-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .tenant-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }
        .tenant-initials {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e3f2fd;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #1976d2;
        }
        .tenant-details {
          display: flex;
          flex-direction: column;
        }
        .tenant-name {
          font-weight: 600;
          font-size: 14px;
          color: #262b43;
        }
        .tenant-email {
          font-size: 12px;
          color: #6c757d;
        }
        .property-info {
          margin-top: 8px;
        }
        .property-info p {
          margin: 4px 0;
          font-size: 14px;
          color: #262b43;
        }
        .bill-to-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .bill-to-row {
          display: flex;
          gap: 16px;
        }
        .bill-to-label {
          min-width: 100px;
          font-size: 14px;
          color: #6c757d;
        }
        .bill-to-value {
          font-weight: 600;
          font-size: 14px;
          color: #262b43;
        }
        .invoice-items-table {
          width: 100%;
          border-collapse: collapse;
          margin: 32px 0;
          border: 1px solid #e0e0e0;
        }
        .invoice-items-table thead {
          background: #f5f5f9;
        }
        .invoice-items-table th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 14px;
          color: #262b43;
          border-bottom: 1px solid #e0e0e0;
        }
        .invoice-items-table td {
          padding: 12px 16px;
          font-size: 14px;
          color: #262b43;
          border-bottom: 1px solid #e0e0e0;
        }
        .invoice-items-table tbody tr:last-child td {
          border-bottom: none;
        }
        .summary-section {
          display: flex;
          justify-content: space-between;
          margin-top: 32px;
          padding-top: 16px;
          border-top: 2px dashed #e0e0e0;
        }
        .summary-left {
          flex: 1;
        }
        .summary-right {
          min-width: 200px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .summary-label {
          font-size: 14px;
          color: #6c757d;
        }
        .summary-value {
          font-weight: 600;
          font-size: 14px;
          color: #262b43;
        }
        .summary-total {
          display: flex;
          justify-content: space-between;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e0e0e0;
        }
        .summary-total-label {
          font-weight: 600;
          font-size: 16px;
          color: #262b43;
        }
        .summary-total-value {
          font-weight: 600;
          font-size: 16px;
          color: #262b43;
        }
        .description-section {
          margin-top: 32px;
          padding-top: 16px;
          border-top: 2px dashed #e0e0e0;
        }
        .description-section p {
          font-size: 14px;
          color: #262b43;
          line-height: 1.6;
        }
        .description-label {
          font-weight: 600;
          margin-right: 8px;
        }
        @media print {
          body {
            padding: 20px;
          }
          .invoice-container {
            max-width: 100%;
          }
        }
      </style>
    `

    // Build the HTML content
    const subtotal = invoiceData.invoiceItems?.reduce((sum, item) => sum + item.quantity * item.price, 0) || 0
    const total = invoiceData.amount ?? subtotal

    const formatDate = (dateString: string): string => {
      const date = new Date(dateString)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()

      return `${day}/${month}/${year}`
    }

    const formatAmt = (n: number | undefined | null) => `₵${(n ?? 0).toFixed(2)}`

    const occupantInitials = invoiceData.occupantName
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || ''

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Invoice ${invoiceData.invoiceNumber || _invoiceId}</title>
          ${styles}
        </head>
        <body>
          <div class="invoice-container">
            <!-- Header -->
            <div class="invoice-header">
              <div class="header-content">
                <div class="header-left">
                </div>
                <div class="header-right">
                  <div class="invoice-title">Invoice #${invoiceData.invoiceNumber || _invoiceId}</div>
                  <div class="invoice-details">
                    <p>Date Issued: ${formatDate(invoiceData.issuedDate)}</p>
                    <p>Date Due: ${formatDate(invoiceData.dueDate)}</p>
                    ${invoiceData.invoiceMonth ? `<p>Invoice Month: ${invoiceData.invoiceMonth}</p>` : ''}

                  </div>
                </div>
              </div>
            </div>

            <!-- Invoice To and Bill To -->
            <div class="invoice-info-section">
              <div class="invoice-to">
                <div class="section-title">Invoice To:</div>
                <div class="tenant-info">
                  <div class="tenant-initials">${occupantInitials}</div>
                  <div class="tenant-details">
                    <div class="tenant-name">${invoiceData.occupantName || '—'}</div>
                    <div class="tenant-email">${invoiceData.occupantEmail || '—'}</div>
                  </div>
                </div>
                <div class="property-info">
                  <p>${invoiceData.propertyName || ''}</p>
                  ${invoiceData.unitNo ? `<p>Unit ${invoiceData.unitNo}</p>` : ''}
                </div>
              </div>
              <div class="bill-to">
                <div class="section-title">Bill To:</div>
                <div class="bill-to-details">
                  <div class="bill-to-row">
                    <span class="bill-to-label">Total Due:</span>
                    <span class="bill-to-value">${formatAmt(invoiceData.amount)}</span>
                  </div>
                  <div class="bill-to-row">
                    <span class="bill-to-label">Balance:</span>
                    <span class="bill-to-value">${formatAmt(invoiceData.balance)}</span>
                  </div>
                  <div class="bill-to-row">
                    <span class="bill-to-label">Status:</span>
                    <span class="bill-to-value" style="text-transform: capitalize;">${invoiceData.status?.toLowerCase() || ''}</span>
                  </div>
                  ${invoiceData.invoiceType ? `
                  <div class="bill-to-row">
                    <span class="bill-to-label">Invoice Type:</span>
                    <span class="bill-to-value">${invoiceData.invoiceType}</span>
                  </div>
                  ` : ''}
                </div>
              </div>
            </div>

            <!-- Invoice Items Table -->
            ${invoiceData.invoiceItems && invoiceData.invoiceItems.length > 0 ? `
            <table class="invoice-items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceData.invoiceItems.map((item, index) => {
                  const itemTotal = item.quantity * item.price

                  
return `
                    <tr>
                      <td>Item ${index + 1}</td>
                      <td>${item.description}</td>
                      <td>${item.quantity}</td>
                      <td>₵${item.price.toFixed(2)}</td>
                      <td>₵${itemTotal.toFixed(2)}</td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
            ` : ''}

            <!-- Summary -->
            <div class="summary-section">
              ${invoiceData.description ? `
              <div class="summary-left">
                <p><span class="description-label">Description:</span>${invoiceData.description}</p>
              </div>
              ` : ''}
              <div class="summary-right">
                <div class="summary-row">
                  <span class="summary-label">Subtotal:</span>
                  <span class="summary-value">&#8373;${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-total">
                  <span class="summary-total-label">Total:</span>
                  <span class="summary-total-value">&#8373;${(typeof total === 'number' ? total : subtotal).toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Trigger download by printing to PDF
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }

  return (
    <>
      <Card className='no-print'>
        <CardContent className='flex flex-col gap-4'>
          <Button
            fullWidth
            variant='contained'
            color='primary'
            className='capitalize'
            startIcon={<i className='ri-send-plane-line' />}
            onClick={() => setSendDrawerOpen(true)}
          >
            Send Invoice
          </Button>
          <Button
            fullWidth
            color='secondary'
            variant='outlined'
            className='capitalize'
            onClick={handleDownload}
            startIcon={<i className='ri-download-line' />}
          >
            Download
          </Button>
          <div className='flex items-center gap-4'>
            <Button
              fullWidth
              color='secondary'
              variant='outlined'
              className='capitalize'
              onClick={handlePrint}
              startIcon={<i className='ri-printer-line' />}
            >
              Print
            </Button>
            <Button
              fullWidth
              color='secondary'
              variant='outlined'
              className='capitalize'
              onClick={() => setEditDialogOpen(true)}
              startIcon={<i className='ri-pencil-line' />}
            >
              Edit
            </Button>
          </div>
          <Button
            fullWidth
            color='success'
            variant='contained'
            className='capitalize'
            startIcon={<i className='ri-money-dollar-circle-line' />}
            onClick={() => setPaymentDrawerOpen(true)}
          >
            Add Payment
          </Button>
        </CardContent>
      </Card>

      {/* Send Invoice Drawer */}
      <SendInvoiceDrawer
        open={sendDrawerOpen}
        handleClose={() => setSendDrawerOpen(false)}
        invoiceData={
          invoiceData
            ? {
                invoiceNumber: invoiceData.invoiceNumber,
                tenantEmail: invoiceData.occupantEmail ?? '',
                tenantName: invoiceData.occupantName ?? '',
                amount: `₵${(invoiceData.amount ?? 0).toFixed(2)}`,
                dueDate: invoiceData.dueDate
              }
            : undefined
        }
      />

      {/* Add Payment Drawer */}
      <AddPaymentDrawer
        open={paymentDrawerOpen}
        handleClose={() => setPaymentDrawerOpen(false)}
        onPaymentRecorded={onPaymentRecorded}
        invoiceData={
          invoiceData
            ? {
                id: invoiceData.id,
                balance: `₵${(invoiceData.balance ?? 0).toFixed(2)}`,
                amount: `₵${(invoiceData.amount ?? 0).toFixed(2)}`,
                invoiceNumber: invoiceData.invoiceNumber,
                occupantId: invoiceData.occupantId ?? undefined,
                occupantName: invoiceData.occupantName ?? undefined
              }
            : undefined
        }
      />

      {/* Edit Invoice Dialog */}
      <AddInvoiceDialog
        open={editDialogOpen}
        handleClose={() => setEditDialogOpen(false)}
        editInvoice={invoiceData ?? null}
        onSaved={() => {
          setEditDialogOpen(false)
          router.refresh()
        }}
      />
    </>
  )
}

export default ViewInvoiceActions

