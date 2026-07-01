'use client'

import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Skeleton from '@mui/material/Skeleton'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

// Third-party Imports
import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

// API Imports
import { inspectionsApi, signOffInspection, getInspectionReportUrl } from '@/lib/api/inspections'
import type { InspectionSummary, InspectionType, InspectionStatus } from '@/types/inspection'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

const columnHelper = createColumnHelper<InspectionSummary>()

const typeColorMap: Record<InspectionType, 'info' | 'warning'> = {
  MOVE_IN: 'info',
  MOVE_OUT: 'warning'
}

const statusColorMap: Record<InspectionStatus, 'success' | 'secondary'> = {
  COMPLETED: 'success',
  DRAFT: 'secondary'
}

const formatDate = (d?: string | null) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const OccupantInspectionsView = () => {
  const [data, setData] = useState<InspectionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sign-off dialog state
  const [signOffTarget, setSignOffTarget] = useState<InspectionSummary | null>(null)
  const [signOffAck, setSignOffAck] = useState('')
  const [signOffDate, setSignOffDate] = useState('')
  const [signOffLoading, setSignOffLoading] = useState(false)
  const [signOffError, setSignOffError] = useState<string | null>(null)

  const loadInspections = () => {
    setLoading(true)
    setError(null)
    inspectionsApi
      .getMyInspections()
      .then(setData)
      .catch(err => setError(err?.message ?? 'Failed to load inspections'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadInspections()
  }, [])

  const handleOpenSignOff = (insp: InspectionSummary) => {
    setSignOffTarget(insp)
    setSignOffAck('')
    setSignOffDate(new Date().toISOString().split('T')[0])
    setSignOffError(null)
  }

  const handleCloseSignOff = () => {
    setSignOffTarget(null)
    setSignOffAck('')
    setSignOffDate('')
    setSignOffError(null)
  }

  const handleSubmitSignOff = async () => {
    if (!signOffTarget || !signOffDate) return
    setSignOffLoading(true)
    setSignOffError(null)
    try {
      await signOffInspection(signOffTarget.id, {
        tenantAcknowledgement: signOffAck,
        signedOffDate: signOffDate,
      })
      handleCloseSignOff()
      // Refresh the list
      loadInspections()
    } catch {
      setSignOffError('Failed to sign off. Please try again.')
    } finally {
      setSignOffLoading(false)
    }
  }

  const columns = useMemo<ColumnDef<InspectionSummary, any>[]>(
    () => [
      columnHelper.accessor('type', {
        header: 'TYPE',
        cell: ({ row }) => {
          const t = row.original.type
          return <Chip variant='tonal' label={t.replace('_', ' ')} size='small' color={typeColorMap[t] ?? 'secondary'} />
        }
      }),
      columnHelper.accessor('status', {
        header: 'STATUS',
        cell: ({ row }) => {
          const s = row.original.status
          return <Chip variant='tonal' label={s} size='small' color={statusColorMap[s] ?? 'secondary'} />
        }
      }),
      columnHelper.accessor('unitNo', {
        header: 'UNIT NO',
        cell: ({ row }) => <Typography>{row.original.unitNo ?? '—'}</Typography>
      }),
      columnHelper.accessor('propertyName', {
        header: 'PROPERTY',
        cell: ({ row }) => <Typography>{row.original.propertyName ?? '—'}</Typography>
      }),
      columnHelper.accessor('inspectorName', {
        header: 'INSPECTOR',
        cell: ({ row }) => <Typography>{row.original.inspectorName ?? '—'}</Typography>
      }),
      columnHelper.accessor('inspectionDate', {
        header: 'INSPECTION DATE',
        cell: ({ row }) => <Typography>{formatDate(row.original.inspectionDate)}</Typography>
      }),
      columnHelper.display({
        id: 'signedOffDate',
        header: 'SIGNED OFF DATE',
        cell: ({ row }) => (
          <Typography variant='body2'>
            {row.original.signedOffDate
              ? new Date(row.original.signedOffDate).toLocaleDateString()
              : '—'}
          </Typography>
        )
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const insp = row.original
          const canSignOff = insp.status === 'COMPLETED' && !insp.signedOffDate
          return (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {canSignOff && (
                <Button
                  size='small'
                  variant='outlined'
                  color='primary'
                  startIcon={<i className='ri-check-double-line' />}
                  onClick={() => handleOpenSignOff(insp)}
                >
                  Sign Off
                </Button>
              )}
              {insp.status === 'COMPLETED' && (
                <Tooltip title='Download Report'>
                  <IconButton
                    size='small'
                    component='a'
                    href={getInspectionReportUrl(insp.id)}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    <i className='ri-file-download-line' />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )
        }
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const table = useReactTable({
    data,
    columns,
    state: {},
    initialState: { pagination: { pageSize: 10 } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader title='My Inspections' />
        <CardContent>
          {error && <Alert severity='error' className='mbe-4'>{error}</Alert>}

          <div className='overflow-x-auto'>
            <table className={tableStyles.table}>
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <th key={header.id}>
                        {header.isPlaceholder ? null : (
                          <div
                            className={classnames({
                              'flex items-center': header.column.getIsSorted(),
                              'cursor-pointer select-none': header.column.getCanSort()
                            })}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: <i className='ri-arrow-up-s-line text-xl' />,
                              desc: <i className='ri-arrow-down-s-line text-xl' />
                            }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              {loading ? (
                <tbody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {columns.map((_, ci) => (
                        <td key={ci}>
                          <Skeleton variant='text' width='80%' />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              ) : data.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={columns.length} className='text-center py-8'>
                      No inspections found
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component='div'
            className='border-bs'
            count={data.length}
            rowsPerPage={table.getState().pagination.pageSize}
            page={table.getState().pagination.pageIndex}
            SelectProps={{ inputProps: { 'aria-label': 'rows per page' } }}
            onPageChange={(_, page) => table.setPageIndex(page)}
            onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
          />
        </CardContent>
      </Card>

      {/* Sign-off dialog */}
      <Dialog open={!!signOffTarget} onClose={handleCloseSignOff} maxWidth='sm' fullWidth>
        <DialogTitle>Sign Off Inspection</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            By signing off, you confirm that you have reviewed this inspection report
            for <strong>{signOffTarget?.unitNo}</strong> — {signOffTarget?.propertyName}.
          </Typography>
          <TextField
            label='Your acknowledgement (optional)'
            multiline
            minRows={3}
            fullWidth
            value={signOffAck}
            onChange={e => setSignOffAck(e.target.value)}
            placeholder='e.g. I confirm the inspection report is accurate and I accept the documented condition of the unit.'
            sx={{ mb: 2 }}
          />
          <TextField
            label='Sign-off date'
            type='date'
            fullWidth
            value={signOffDate}
            onChange={e => setSignOffDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          {signOffError && (
            <Alert severity='error' sx={{ mt: 2 }}>{signOffError}</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSignOff} disabled={signOffLoading}>Cancel</Button>
          <Button
            variant='contained'
            onClick={handleSubmitSignOff}
            disabled={signOffLoading || !signOffDate}
            startIcon={signOffLoading ? <CircularProgress size={16} color='inherit' /> : <i className='ri-check-line' />}
          >
            {signOffLoading ? 'Signing off…' : 'Sign Off'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default OccupantInspectionsView
