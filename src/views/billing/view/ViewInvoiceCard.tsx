'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Divider from '@mui/material/Divider'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import CustomAvatar from '@core/components/mui/Avatar'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// Helper function to format dates consistently
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  
return `${day}/${month}/${year}`
}

type InvoiceItem = {
  id: number
  description: string
  quantity: number
  price: number
}

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
  invoiceItems?: InvoiceItem[]
}

type Props = {
  invoiceData?: InvoiceData
  invoiceId: string
}

const ViewInvoiceCard = ({ invoiceData, invoiceId }: Props) => {
  // Calculate totals from invoice items
  const subtotal = invoiceData?.invoiceItems?.reduce((sum, item) => sum + item.quantity * item.price, 0) || 0
  const total = subtotal

  return (
    <Card className='previewCard'>
      <CardContent className='sm:!p-12'>
        <Grid container spacing={6}>
          {/* Header Section */}
          <Grid size={{ xs: 12 }}>
            <div className='p-6 bg-actionHover rounded'>
              <div className='flex justify-between gap-y-4 flex-col sm:flex-row'>
                <div className='flex flex-col gap-6'>
                  <div className='flex items-center gap-2.5'>
                    <Logo />
                  </div>
                  <div>
                    <Typography color='text.primary'>Office 149, 450 South Brand Brooklyn</Typography>
                    <Typography color='text.primary'>San Diego County, CA 91905, USA</Typography>
                    <Typography color='text.primary'>+1 (123) 456 7891, +44 (876) 543 2198</Typography>
                  </div>
                </div>
                <div className='flex flex-col gap-6'>
                  <Typography variant='h5'>{`Invoice #${invoiceData?.invoiceNumber || invoiceId}`}</Typography>
                  <div className='flex flex-col gap-1'>
                    <Typography color='text.primary'>
                      {`Date Issued: ${invoiceData?.issuedDate ? formatDate(invoiceData.issuedDate) : 'N/A'}`}
                    </Typography>
                    <Typography color='text.primary'>
                      {`Date Due: ${invoiceData?.dueDate ? formatDate(invoiceData.dueDate) : 'N/A'}`}
                    </Typography>
                    {invoiceData?.invoiceMonth && (
                      <Typography color='text.primary'>{`Invoice Month: ${invoiceData.invoiceMonth}`}</Typography>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Grid>

          {/* Invoice To and Bill To Section */}
          <Grid size={{ xs: 12 }}>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <div className='flex flex-col gap-4'>
                  <Typography className='font-medium' color='text.primary'>
                    Invoice To:
                  </Typography>
                  <div className='flex items-center gap-3'>
                    {invoiceData?.tenantAvatar ? (
                      <CustomAvatar src={invoiceData.tenantAvatar} skin='light' size={40} />
                    ) : (
                      <CustomAvatar skin='light' size={40}>
                        {invoiceData?.tenantName
                          ?.split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </CustomAvatar>
                    )}
                    <div className='flex flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        {invoiceData?.tenantName}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {invoiceData?.tenantEmail}
                      </Typography>
                    </div>
                  </div>
                  <div className='mts-2'>
                    <Typography variant='body2' color='text.primary'>
                      {invoiceData?.propertyName}
                    </Typography>
                    <Typography variant='body2' color='text.primary'>
                      {invoiceData?.unitName}
                    </Typography>
                  </div>
                </div>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <div className='flex flex-col gap-4'>
                  <Typography className='font-medium' color='text.primary'>
                    Bill To:
                  </Typography>
                  <div className='flex flex-col gap-2'>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]' variant='body2'>
                        Total Due:
                      </Typography>
                      <Typography className='font-medium' color='text.primary'>
                        {invoiceData?.amount || '₵0'}
                      </Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]' variant='body2'>
                        Balance:
                      </Typography>
                      <Typography className='font-medium' color='text.primary'>
                        {invoiceData?.balance || '₵0'}
                      </Typography>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Typography className='min-is-[100px]' variant='body2'>
                        Status:
                      </Typography>
                      <Typography className='font-medium capitalize' color='text.primary'>
                        {invoiceData?.status || 'N/A'}
                      </Typography>
                    </div>
                    {invoiceData?.invoiceType && (
                      <div className='flex items-center gap-4'>
                        <Typography className='min-is-[100px]' variant='body2'>
                          Invoice Type:
                        </Typography>
                        <Typography className='font-medium' color='text.primary'>
                          {invoiceData.invoiceType}
                        </Typography>
                      </div>
                    )}
                  </div>
                </div>
              </Grid>
            </Grid>
          </Grid>

          {/* Invoice Items Table */}
          {invoiceData?.invoiceItems && invoiceData.invoiceItems.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <div className='overflow-x-auto border rounded'>
                <table className={tableStyles.table}>
                  <thead>
                    <tr className='border-be'>
                      <th className='!bg-transparent'>Item</th>
                      <th className='!bg-transparent'>Description</th>
                      <th className='!bg-transparent'>Quantity</th>
                      <th className='!bg-transparent'>Price</th>
                      <th className='!bg-transparent'>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.invoiceItems.map((item, index) => {
                      const itemTotal = item.quantity * item.price

                      return (
                        <tr key={item.id || index}>
                          <td>
                            <Typography color='text.primary'>Item {index + 1}</Typography>
                          </td>
                          <td>
                            <Typography color='text.primary'>{item.description}</Typography>
                          </td>
                          <td>
                            <Typography color='text.primary'>{item.quantity}</Typography>
                          </td>
                          <td>
                            <Typography color='text.primary'>₵{item.price.toFixed(2)}</Typography>
                          </td>
                          <td>
                            <Typography color='text.primary'>₵{itemTotal.toFixed(2)}</Typography>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Grid>
          )}

          {/* Summary Section */}
          <Grid size={{ xs: 12 }}>
            <div className='flex justify-between flex-col gap-y-4 sm:flex-row'>
              {invoiceData?.description && (
                <div className='flex flex-col gap-1 order-2 sm:order-[unset]'>
                  <Typography>
                    <Typography component='span' className='font-medium' color='text.primary'>
                      Description:
                    </Typography>{' '}
                    {invoiceData.description}
                  </Typography>
                </div>
              )}
              <div className='min-is-[200px]'>
                <div className='flex items-center justify-between'>
                  <Typography>Subtotal:</Typography>
                  <Typography className='font-medium' color='text.primary'>
                    ₵{subtotal.toFixed(2)}
                  </Typography>
                </div>
                <Divider className='mlb-2' />
                <div className='flex items-center justify-between'>
                  <Typography className='font-medium'>Total:</Typography>
                  <Typography className='font-medium' color='text.primary'>
                    ₵{total.toFixed(2)}
                  </Typography>
                </div>
              </div>
            </div>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Divider className='border-dashed' />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant='body2' color='text.secondary'>
              Thank you for your business!
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ViewInvoiceCard

