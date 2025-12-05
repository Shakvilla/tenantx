// Documentation: /docs/reports/reports-flow.md

'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

// Type Imports
import type { ReportSummary } from '@/types/reports/reportTypes'

type Props = {
  summaries: ReportSummary[]
}

const StyledCard = styled(Card)<{ color?: string }>(({ theme, color }) => ({
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: color
      ? `linear-gradient(90deg, var(--mui-palette-${color}-main), var(--mui-palette-${color}-light))`
      : 'linear-gradient(90deg, var(--mui-palette-primary-main), var(--mui-palette-primary-light))',
    borderRadius: '4px 4px 0 0'
  }
}))

const ReportSummaryCards = ({ summaries }: Props) => {
  return (
    <Grid container spacing={4}>
      {summaries.map((summary, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
          <StyledCard color={summary.color || 'primary'}>
            <CardContent>
              <div className='flex items-center justify-between'>
                <div className='flex flex-col gap-1'>
                  <Typography variant='body2' color='text.secondary'>
                    {summary.label}
                  </Typography>
                  <Typography variant='h4'>{summary.value}</Typography>
                  {summary.change !== undefined && (
                    <Typography
                      variant='caption'
                      color={summary.changeType === 'increase' ? 'success.main' : 'error.main'}
                    >
                      {summary.changeType === 'increase' ? '+' : ''}
                      {summary.change}% from last period
                    </Typography>
                  )}
                </div>
                {summary.icon && (
                  <div
                    className='flex items-center justify-center rounded-full p-3'
                    style={{
                      backgroundColor: `var(--mui-palette-${summary.color || 'primary'}-lightOpacity)`
                    }}
                  >
                    <i className={`${summary.icon} text-2xl`} style={{ color: `var(--mui-palette-${summary.color || 'primary'}-main)` }} />
                  </div>
                )}
              </div>
            </CardContent>
          </StyledCard>
        </Grid>
      ))}
    </Grid>
  )
}

export default ReportSummaryCards

