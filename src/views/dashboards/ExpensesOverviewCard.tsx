'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import RowActions from '@components/table/RowActions'
import CustomAvatar from '@core/components/mui/Avatar'

// API Imports
import { getExpenses, getExpenseStats, type Expense, type ExpenseStats } from '@/lib/api/expenses'

const ICON_COLORS: Array<'primary' | 'warning' | 'info' | 'success'> = ['primary', 'warning', 'info', 'success']

const ICONS = [
  'ri-tools-line',
  'ri-pie-chart-2-line',
  'ri-exchange-line',
  'ri-user-line',
  'ri-home-line',
  'ri-building-line'
]

const ExpensesOverviewCard = () => {
  const [stats, setStats] = useState<ExpenseStats | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getExpenseStats(), getExpenses()])
      .then(([s, exp]) => {
        setStats(s)
        setExpenses(exp)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Group by item name, sum amounts, take top 4
  const topExpenseTypes = (() => {
    const map: Record<string, number> = {}

    expenses.forEach(exp => {
      const key = exp.item || 'Other'

      map[key] = (map[key] || 0) + exp.amount
    })

    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([label, amount], i) => ({
        label,
        amount: amount >= 1000
          ? `₵${(amount / 1000).toFixed(1)}k`
          : `₵${amount.toFixed(0)}`,
        icon: ICONS[i % ICONS.length],
        iconColor: ICON_COLORS[i % ICON_COLORS.length]
      }))
  })()

  const totalAmount = stats?.totalAmount ?? 0
  const totalDisplay = totalAmount >= 1000
    ? `₵${(totalAmount / 1000).toFixed(1)}k`
    : `₵${totalAmount.toFixed(0)}`

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={
          <div className='flex flex-col items-start gap-2'>
            <Typography variant='h5' className='font-semibold' color='text.primary'>
              Expenses Overview
            </Typography>
            {!loading && (
              <div className='flex items-center gap-1'>
                <Typography variant='subtitle2' color='text.primary'>
                  Total Expenses: {totalDisplay}
                </Typography>
              </div>
            )}
          </div>
        }
        action={<RowActions options={['Refresh', 'Share', 'Update']} />}
      />
      <CardContent className='flex flex-col gap-4 flex-1'>
        {loading ? (
          <Box className='flex justify-center py-4'>
            <CircularProgress size={28} />
          </Box>
        ) : topExpenseTypes.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
            {topExpenseTypes.map((expense, index) => (
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
        ) : (
          <Typography variant='body2' color='text.secondary' className='text-center py-4'>
            No expenses recorded yet
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

export default ExpensesOverviewCard
