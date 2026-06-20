'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'

import CustomAvatar from '@core/components/mui/Avatar'
import RowActions from '@components/table/RowActions'
import AddAgentDrawer from './AddAgentDrawer'
import AgentCommissionsDialog from './AgentCommissionsDialog'

import { getAgents, deleteAgent } from '@/lib/api/agents'
import { getInitials } from '@/utils/getInitials'
import type { AgentType } from '@/types/members/agentTypes'

import tableStyles from '@core/styles/table.module.css'

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)
  addMeta({ itemRank })
  return itemRank.passed
}

const columnHelper = createColumnHelper<AgentType>()

const statusColor: Record<string, 'success' | 'info' | 'secondary' | 'error'> = {
  active:    'success',
  inactive:  'secondary',
  suspended: 'error'
}

const AgentsListTable = () => {
  const [data, setData]               = useState<AgentType[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [drawerOpen, setDrawerOpen]   = useState(false)
  const [editAgent, setEditAgent]     = useState<AgentType | null>(null)
  const [commAgent, setCommAgent]     = useState<AgentType | null>(null)
  const [commOpen, setCommOpen]       = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  })

  const loadAgents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getAgents())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAgents() }, [loadAgents])

  const handleEdit = (agent: AgentType) => {
    setEditAgent(agent)
    setDrawerOpen(true)
  }

  const handleDelete = async (agent: AgentType) => {
    if (!confirm(`Delete agent "${agent.name}"? This cannot be undone.`)) return
    try {
      await deleteAgent(agent.id)
      await loadAgents()
      setSnackbar({ open: true, message: 'Agent deleted', severity: 'success' })
    } catch (err) {
      setSnackbar({ open: true, message: err instanceof Error ? err.message : 'Delete failed', severity: 'error' })
    }
  }

  const handleOpenCommissions = (agent: AgentType) => {
    setCommAgent(agent)
    setCommOpen(true)
  }

  const columns = useMemo<ColumnDef<AgentType, any>[]>(() => [
    columnHelper.accessor('name', {
      header: 'AGENT',
      cell: ({ row }) => (
        <div className='flex items-center gap-3'>
          <CustomAvatar skin='light' color='primary' size={34}>
            {getInitials(row.original.name)}
          </CustomAvatar>
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>{row.original.name}</Typography>
            <Typography variant='caption' color='text.secondary'>{row.original.email || row.original.phone}</Typography>
          </div>
        </div>
      )
    }),
    columnHelper.accessor('phone', {
      header: 'PHONE',
      cell: ({ row }) => <Typography variant='body2'>{row.original.phone}</Typography>
    }),
    columnHelper.accessor('location', {
      header: 'LOCATION',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary'>{row.original.location || '—'}</Typography>
      )
    }),
    columnHelper.accessor('commissionRate', {
      header: 'COMMISSION',
      cell: ({ row }) => (
        <Typography variant='body2' className='font-medium'>
          {row.original.commissionType === 'percentage'
            ? `${row.original.commissionRate}%`
            : `GHS ${row.original.commissionRate}`}
        </Typography>
      )
    }),
    columnHelper.accessor('status', {
      header: 'STATUS',
      cell: ({ row }) => (
        <Chip
          label={row.original.status}
          size='small'
          color={statusColor[row.original.status] || 'default'}
          variant='tonal'
          className='capitalize'
        />
      )
    }),
    columnHelper.display({
      id: 'actions',
      header: 'ACTIONS',
      cell: ({ row }) => (
        <div className='flex items-center gap-1'>
          <Tooltip title='View commissions'>
            <IconButton size='small' onClick={() => handleOpenCommissions(row.original)}>
              <i className='ri-money-dollar-circle-line text-base' />
            </IconButton>
          </Tooltip>
          <RowActions
            iconButtonProps={{ size: 'small' }}
            options={[
              { text: 'Edit', icon: 'ri-pencil-line', menuItemProps: { onClick: () => handleEdit(row.original) } },
              {
                text: 'Delete', icon: 'ri-delete-bin-line',
                menuItemProps: { onClick: () => handleDelete(row.original), sx: { color: 'error.main' } }
              }
            ]}
          />
        </div>
      )
    })
  ], [])

  const table = useReactTable({
    data,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Agents'
          subheader={`${data.length} letting agent${data.length !== 1 ? 's' : ''}`}
          action={
            <div className='flex items-center gap-3'>
              <TextField
                size='small'
                placeholder='Search agents…'
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
              />
              <Button
                variant='contained'
                startIcon={<i className='ri-add-line' />}
                onClick={() => { setEditAgent(null); setDrawerOpen(true) }}
              >
                Add Agent
              </Button>
            </div>
          }
        />
        <Divider />
        <CardContent>
          {loading ? (
            <Box display='flex' justifyContent='center' py={6}><CircularProgress /></Box>
          ) : error ? (
            <Box display='flex' justifyContent='center' py={6}>
              <Typography color='error'>{error}</Typography>
            </Box>
          ) : (
            <div className='overflow-x-auto'>
              <table className={tableStyles.table}>
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => (
                        <th key={h.id}>
                          {h.isPlaceholder ? null : (
                            <div
                              className={classnames({
                                'flex items-center': h.column.getIsSorted(),
                                'cursor-pointer select-none': h.column.getCanSort()
                              })}
                              onClick={h.column.getToggleSortingHandler()}
                            >
                              {flexRender(h.column.columnDef.header, h.getContext())}
                              {{ asc: <i className='ri-arrow-up-s-line text-xl' />, desc: <i className='ri-arrow-down-s-line text-xl' /> }[h.column.getIsSorted() as string] ?? null}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                {table.getFilteredRowModel().rows.length === 0 ? (
                  <tbody>
                    <tr>
                      <td colSpan={table.getVisibleFlatColumns().length} className='text-center py-8'>
                        No agents found.
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody className='border-be'>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          )}
          {!loading && !error && (
            <TablePagination
              component='div'
              className='border-bs'
              count={table.getFilteredRowModel().rows.length}
              rowsPerPage={table.getState().pagination.pageSize}
              page={table.getState().pagination.pageIndex}
              rowsPerPageOptions={[10, 25, 50]}
              onPageChange={(_, page) => table.setPageIndex(page)}
              onRowsPerPageChange={e => { table.setPageSize(Number(e.target.value)); table.setPageIndex(0) }}
            />
          )}
        </CardContent>
      </Card>

      <AddAgentDrawer
        open={drawerOpen}
        handleClose={() => { setDrawerOpen(false); setEditAgent(null) }}
        editAgent={editAgent}
        onSuccess={() => { loadAgents(); setSnackbar({ open: true, message: editAgent ? 'Agent updated' : 'Agent created', severity: 'success' }) }}
      />

      <AgentCommissionsDialog
        open={commOpen}
        agent={commAgent}
        onClose={() => setCommOpen(false)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default AgentsListTable
