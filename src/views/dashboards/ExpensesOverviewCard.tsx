'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'

type ExpenseItem = {
  label: string
  amount: string
  icon: string
  iconColor: 'primary' | 'warning' | 'info' | 'success'
}

const ExpensesOverviewCard = () => {
  const expenses: ExpenseItem[] = [
    {
      label: 'Maintenance',
      amount: '₵23.5k',
      icon: 'ri-tools-line',
      iconColor: 'primary'
    },
    {
      label: 'Taxes',
      amount: '₵3.5k',
      icon: 'ri-pie-chart-2-line',
      iconColor: 'warning'
    },
    {
      label: 'Mortgage Payments',
      amount: '₵32.5k',
      icon: 'ri-exchange-line',
      iconColor: 'info'
    },
    {
      label: 'Staff Payments',
      amount: '₵52.5k',
      icon: 'ri-user-line',
      iconColor: 'success'
    }
  ]

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <div className='flex flex-col items-start gap-2'>
            <Typography variant='h5' className='font-semibold' color='text.primary'>
              Expenses Overview
            </Typography>
            <div className='flex items-center gap-1'>
              <Typography variant='subtitle2' color='text.primary'>
                Total Expenses: ₵152.5k
              </Typography>
              <Typography color='success.main' className='flex items-center gap-1 font-medium'>
                +18%
                <i className='ri-arrow-up-s-line text-sm' />
              </Typography>
            </div>
          </div>
        }
        action={<OptionMenu options={['Refresh', 'Share', 'Update']} />}
      />
      <CardContent className='flex flex-col gap-4 flex-1'>
        <div className='flex items-center gap-2'></div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
          {expenses.map((expense, index) => (
            <div key={index} className='flex items-center gap-x-3 gap-y-6'>
              <CustomAvatar variant='rounded' skin='light' color={expense.iconColor} size={40}>
                <i className={expense.icon} />
              </CustomAvatar>
              <div className='flex flex-col flex-1'>
                <Typography variant='subtitle1' className='font-semibold' color='text.primary'>
                  {expense.amount}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {expense.label}
                </Typography>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default ExpensesOverviewCard
