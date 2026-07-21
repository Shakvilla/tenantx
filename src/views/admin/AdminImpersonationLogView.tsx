'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import TablePagination from '@mui/material/TablePagination'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'

import {
  getGlobalImpersonationLog,
  type ImpersonationLogDto,
} from '@/lib/api/admin-auth-client'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

const columnHelper = createColumnHelper<ImpersonationLogDto>()

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function AdminImpersonationLogView() {
  const [rows, setRows]         = useState<ImpersonationLogDto[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [page, setPage]         = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [totalElements, setTotalElements] = useState(0)

  const load = useCallback(async (p: number, size: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getGlobalImpersonationLog(p, size)
      setRows(res.items)
      setPage(res.page)
      setTotalElements(res.totalItems)
    } catch {
      setError('Failed to load impersonation log')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(0, pageSize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const columns = useMemo(() => [
    columnHelper.display({ id: 'timestamp', header: 'Timestamp' }),
    columnHelper.display({ id: 'admin', header: 'Admin' }),
    columnHelper.display({ id: 'tenant', header: 'Target Tenant' }),
    columnHelper.display({ id: 'targetUser', header: 'Target User' }),
    columnHelper.display({ id: 'reason', header: 'Reason' }),
    columnHelper.display({ id: 'expiresAt', header: 'Token Expires' }),
  ], [])

  const table = useReactTable({
    data: rows,
    columns,
    manualPagination: true,
    pageCount: Math.ceil(totalElements / pageSize),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h5' fontWeight={600} gutterBottom>
        Impersonation Log
      </Typography>
      <Typography variant='body2' color='text.secondary' mb={3}>
        Global, cross-tenant audit trail of every admin impersonation session. Newest first.
      </Typography>

      <Card variant='outlined'>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Box sx={{ p: 2 }}>
              <Alert severity='error'>{error}</Alert>
            </Box>
          )}

          {!loading && !error && (
            <>
              <table className={tableStyles.table}>
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>
                        No impersonation events recorded.
                      </td>
                    </tr>
                  ) : rows.map(entry => (
                    <tr key={entry.id}>
                      <td style={{ padding: '4px 8px' }}>
                        <Typography variant='caption' sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                          {fmt(entry.impersonatedAt)}
                        </Typography>
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <Typography variant='body2'>{entry.adminEmail}</Typography>
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {entry.targetTenantId}
                        </Typography>
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <Typography variant='body2' color='text.secondary'>
                          {entry.targetUserEmail}
                        </Typography>
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <Typography variant='body2' color='text.secondary'>
                          {entry.reason ?? '—'}
                        </Typography>
                      </td>
                      <td style={{ padding: '4px 8px' }}>
                        <Typography variant='caption' color='text.disabled'>
                          {fmt(entry.tokenExpiresAt)}
                        </Typography>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component='div'
                count={totalElements}
                rowsPerPage={pageSize}
                page={page}
                onPageChange={(_, newPage) => { setPage(newPage); load(newPage, pageSize) }}
                onRowsPerPageChange={e => {
                  const newSize = Number(e.target.value)
                  setPageSize(newSize)
                  setPage(0)
                  load(0, newSize)
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}
