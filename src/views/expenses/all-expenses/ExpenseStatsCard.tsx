'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'

type Props = {
  totalExpenses: number
}

const ExpenseStatsCard = ({ totalExpenses }: Props) => {
  return (
    <Card className='mbs-6'>
      <CardContent>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <div className='flex flex-col gap-1'>
              <Typography variant='body2' color='text.secondary'>
                Total Expense
              </Typography>
              <Typography variant='h4' color='text.primary' className='font-semibold'>
                GH₵ {totalExpenses.toFixed(2)}
              </Typography>
            </div>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ExpenseStatsCard

