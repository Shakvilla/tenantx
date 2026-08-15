'use client'

// React Imports
import { useState, useEffect, useRef } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'

// Component Imports
import ReportSummaryCards from '@/components/reports/ReportSummaryCards'
import ExportButtons from '@/components/reports/ExportButtons'

// API Imports
import { getGraIncomeSummary } from '@/lib/api/gra'

// Util Imports
import { formatCurrency } from '@/utils/currency'

// Type Imports
import type { GraTaxSummary } from '@/types/gra'
import type { ReportSummary } from '@/types/reports/reportTypes'

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)

const QUARTER_OPTIONS = [
  { value: '', label: 'Full Year' },
  { value: '1', label: 'Q1 (Jan – Mar)' },
  { value: '2', label: 'Q2 (Apr – Jun)' },
  { value: '3', label: 'Q3 (Jul – Sep)' },
  { value: '4', label: 'Q4 (Oct – Dec)' },
]

const GraComplianceReport = () => {
  const contentRef = useRef<HTMLDivElement>(null)

  const [year, setYear] = useState<number>(CURRENT_YEAR)
  const [quarter, setQuarter] = useState<string>('')
  const [data, setData] = useState<GraTaxSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getGraIncomeSummary(year, quarter ? Number(quarter) : undefined)
      .then(setData)
      .catch(err => setError(err.message ?? 'Failed to load GRA summary'))
      .finally(() => setLoading(false))
  }, [year, quarter])

  // Safe array — backend may return null for properties when the list is empty
  const properties = data?.properties ?? []

  // Summary cards
  const summaries: ReportSummary[] = data
    ? [
        {
          label: 'Total Invoiced',
          value: formatCurrency(data.totalInvoiced),
          icon: 'ri-file-list-3-line',
          color: 'primary',
        },
        {
          label: 'Total Collected',
          value: formatCurrency(data.totalCollected),
          icon: 'ri-check-double-line',
          color: 'success',
        },
        {
          label: 'Estimated WHT (8%)',
          value: formatCurrency(data.estimatedWHT),
          icon: 'ri-government-line',
          color: 'warning',
        },
        {
          label: 'Paid Invoices',
          value: data.invoiceCount,
          icon: 'ri-receipt-line',
          color: 'info',
        },
      ]
    : []

  // Export data shape
  const exportData = properties.map(p => ({
    Property: p.propertyName,
    'Total Invoiced (GHS)': p.totalInvoiced,
    'Total Collected (GHS)': p.totalCollected,
    'Estimated WHT @ 8% (GHS)': p.estimatedWHT,
  }))

  const periodLabel = quarter
    ? `Q${quarter} ${year}`
    : `Full Year ${year}`

  return (
    <Box ref={contentRef}>
      {/* Controls row */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap', mb: 5 }}>
        <FormControl size='small' sx={{ minWidth: 120 }}>
          <InputLabel>Year</InputLabel>
          <Select
            value={year}
            label='Year'
            onChange={e => setYear(Number(e.target.value))}
          >
            {YEAR_OPTIONS.map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size='small' sx={{ minWidth: 160 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={quarter}
            label='Period'
            onChange={e => setQuarter(e.target.value)}
          >
            {QUARTER_OPTIONS.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        <ExportButtons
          title={`GRA Income Summary — ${periodLabel}`}
          data={exportData}
          filename={`gra-income-summary-${year}${quarter ? `-q${quarter}` : ''}`}
          contentRef={contentRef as React.RefObject<HTMLElement>}
        />
      </Box>

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error */}
      {!loading && error && (
        <Alert severity='error' sx={{ mb: 4 }}>{error}</Alert>
      )}

      {/* Content */}
      {!loading && !error && data && (
        <Grid container spacing={5}>
          {/* Summary cards */}
          <Grid size={{ xs: 12 }}>
            <ReportSummaryCards summaries={summaries} />
          </Grid>

          {/* GRA info banner */}
          <Grid size={{ xs: 12 }}>
            <Alert
              severity='info'
              icon={<i className='ri-information-line' />}
              sx={{ '& .MuiAlert-message': { width: '100%' } }}
            >
              <Typography variant='body2'>
                <strong>GRA Withholding Tax (WHT):</strong> 8% on residential rental income for residents
                (GRA Act 896, Section 114). The figures below are estimates based on collected (paid) invoices.
                Consult a tax professional or visit{' '}
                <a href='https://gra.gov.gh' target='_blank' rel='noopener noreferrer'>gra.gov.gh</a>{' '}
                for official filing guidance.
              </Typography>
            </Alert>
          </Grid>

          {/* Per-property breakdown */}
          <Grid size={{ xs: 12 }}>
            <Card variant='outlined'>
              <CardContent sx={{ pb: '12px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant='h6'>Property Breakdown</Typography>
                  <Chip
                    label={periodLabel}
                    variant='tonal'
                    color='primary'
                    size='small'
                  />
                </Box>
                <Divider sx={{ mb: 3 }} />

                {properties.length === 0 ? (
                  <Box sx={{ py: 6, textAlign: 'center' }}>
                    <i className='ri-building-line' style={{ fontSize: 40, opacity: 0.3 }} />
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                      No paid invoices found for this period
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Property</TableCell>
                          <TableCell align='right'>Total Invoiced</TableCell>
                          <TableCell align='right'>Total Collected</TableCell>
                          <TableCell align='right'>Collection Rate</TableCell>
                          <TableCell align='right'>Estimated WHT (8%)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {properties.map(prop => {
                          const rate = prop.totalInvoiced > 0
                            ? Math.round((prop.totalCollected / prop.totalInvoiced) * 100)
                            : 0

                          return (
                            <TableRow key={prop.propertyId} hover>
                              <TableCell>
                                <Typography variant='body2' fontWeight={500}>
                                  {prop.propertyName ?? '—'}
                                </Typography>
                              </TableCell>
                              <TableCell align='right'>
                                <Typography variant='body2'>
                                  {formatCurrency(prop.totalInvoiced)}
                                </Typography>
                              </TableCell>
                              <TableCell align='right'>
                                <Typography variant='body2' color='success.main' fontWeight={500}>
                                  {formatCurrency(prop.totalCollected)}
                                </Typography>
                              </TableCell>
                              <TableCell align='right'>
                                <Chip
                                  label={`${rate}%`}
                                  size='small'
                                  variant='tonal'
                                  color={rate >= 80 ? 'success' : rate >= 50 ? 'warning' : 'error'}
                                />
                              </TableCell>
                              <TableCell align='right'>
                                <Typography variant='body2' color='warning.main' fontWeight={500}>
                                  {formatCurrency(prop.estimatedWHT)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )
                        })}

                        {/* Totals row */}
                        <TableRow sx={{ '& td': { borderTop: '2px solid', borderColor: 'divider', fontWeight: 700 } }}>
                          <TableCell>Total</TableCell>
                          <TableCell align='right'>{formatCurrency(data.totalInvoiced)}</TableCell>
                          <TableCell align='right'>{formatCurrency(data.totalCollected)}</TableCell>
                          <TableCell align='right'>
                            <Chip
                              label={`${data.totalInvoiced > 0 ? Math.round((data.totalCollected / data.totalInvoiced) * 100) : 0}%`}
                              size='small'
                              variant='tonal'
                              color='primary'
                            />
                          </TableCell>
                          <TableCell align='right' sx={{ color: 'warning.main' }}>
                            {formatCurrency(data.estimatedWHT)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Filing reminder */}
          <Grid size={{ xs: 12 }}>
            <Card variant='outlined' sx={{ bgcolor: 'action.hover' }}>
              <CardContent>
                <Typography variant='subtitle2' gutterBottom>
                  <i className='ri-calendar-check-line' style={{ marginRight: 6 }} />
                  GRA Filing Deadlines
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  WHT on rent must be withheld at source and remitted to GRA by the <strong>15th of the following month</strong>.
                  Annual rental income returns are due by <strong>30 April</strong> of the following year.
                  Use the export above to share figures with your accountant or tax agent.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}

export default GraComplianceReport
