// Documentation: /docs/subscription-plans/subscription-plans-module.md

'use client'

// React Imports
import { useState, useMemo, useCallback } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'

// Third-party Imports
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
import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Type Imports
import type { SubscriptionPlan, SubscriptionPlanWithAction } from '@/types/subscription-plans/subscriptionPlanTypes'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import CustomAvatar from '@core/components/mui/Avatar'
import ViewPlanDialog from './ViewSubscriptionPlanDialog'
import AddPlanDialog from './AddSubscriptionPlanDialog'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>
  }
  interface FilterMeta {
    itemRank: RankingInfo
  }
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

// Sample subscription plans data
const samplePlans: SubscriptionPlan[] = [
  {
    id: 1,
    name: 'Basic Plan',
    tier: 'basic',
    description: 'Perfect for small property owners starting out.',
    status: 'active',
    price: '49',
    currency: 'GHS',
    billingCycle: 'monthly',
    trialPeriod: 14,
    maxProperties: 5,
    maxTenants: 20,
    maxUnits: 20,
    maxDocuments: 100,
    maxUsers: 2,
    features: ['Up to 5 properties', 'Basic support', 'Email notifications'],
    isPopular: false,
    createdAt: '2024-01-10'
  },
  {
    id: 2,
    name: 'Standard Plan',
    tier: 'pro',
    description: 'Ideal for growing businesses with multiple properties.',
    status: 'active',
    price: '99',
    currency: 'GHS',
    billingCycle: 'monthly',
    trialPeriod: 14,
    maxProperties: 20,
    maxTenants: 100,
    maxUnits: 100,
    maxDocuments: 500,
    maxUsers: 5,
    features: ['Up to 20 properties', 'Priority support', 'SMS & Email notifications', 'Custom reports'],
    isPopular: true,
    createdAt: '2024-01-15'
  },
  {
    id: 3,
    name: 'Premium Plan',
    tier: 'enterprise',
    description: 'Advanced features for large-scale property management.',
    status: 'active',
    price: '199',
    currency: 'GHS',
    billingCycle: 'monthly',
    trialPeriod: 30,
    maxProperties: 100,
    maxTenants: 500,
    maxUnits: 500,
    maxDocuments: 2000,
    maxUsers: 20,
    features: ['Unlimited properties', '24/7 Dedicated support', 'Advanced analytics', 'API Access', 'Custom branding'],
    isPopular: false,
    createdAt: '2024-02-01'
  },
  {
    id: 4,
    name: 'Enterprise Plan',
    tier: 'enterprise',
    description: 'Custom solutions tailored to your unique requirements.',
    status: 'inactive',
    price: '499',
    currency: 'GHS',
    billingCycle: 'monthly',
    trialPeriod: 30,
    maxProperties: 1000,
    maxTenants: 5000,
    maxUnits: 1000,
    maxDocuments: 10000,
    maxUsers: 100,
    features: ['Unlimited everything', 'On-premise deployment', 'Custom development'],
    isPopular: false,
    createdAt: '2024-03-10'
  }
]

// Vars
const statusObj: Record<string, { title: string; color: 'success' | 'warning' | 'error' | 'secondary' }> = {
  active: { title: 'Active', color: 'success' },
  inactive: { title: 'Inactive', color: 'secondary' },
  archived: { title: 'Archived', color: 'error' }
}

const tierColorObj: Record<string, 'primary' | 'info' | 'success' | 'warning'> = {
  free: 'warning',
  basic: 'primary',
  pro: 'info',
  enterprise: 'success'
}

const SubscriptionPlansListTable = () => {
  // States
  const [data, setData] = useState(samplePlans)
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [status, setStatus] = useState('')
  const [tier, setTier] = useState('')
  const [addPlanOpen, setAddPlanOpen] = useState(false)
  const [editPlanOpen, setEditPlanOpen] = useState(false)
  const [viewPlanOpen, setViewPlanOpen] = useState(false)
  const [deletePlanOpen, setDeletePlanOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)

  // Handle plan operations
  const handleDeletePlan = (planId: number) => {
    setData(data.filter(plan => plan.id !== planId))
    setDeletePlanOpen(false)
    setSelectedPlan(null)
  }

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setEditPlanOpen(true)
  }

  const handleViewPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setViewPlanOpen(true)
  }

  const handleToggleStatus = useCallback((plan: SubscriptionPlan) => {
    setData(prevData => prevData.map(p => (p.id === plan.id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p)))
  }, [])

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = data

    if (status) {
      filtered = filtered.filter(p => p.status === status)
    }

    if (tier) {
      filtered = filtered.filter(p => p.tier === tier)
    }

    if (globalFilter) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
        p.tier.toLowerCase().includes(globalFilter.toLowerCase())
      )
    }

    return filtered
  }, [data, status, tier, globalFilter])

  const columnHelper = createColumnHelper<SubscriptionPlanWithAction>()

  const columns = useMemo<ColumnDef<SubscriptionPlanWithAction, any>[]>(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
          />
        )
      }),
      columnHelper.accessor('name', {
        header: 'PLAN NAME',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <CustomAvatar skin='light' color={tierColorObj[row.original.tier] || 'primary'} size={34}>
              <i className='ri-vip-crown-line text-xl' />
            </CustomAvatar>
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.name}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {`${row.original.features.length} Features`}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('tier', {
        header: 'TIER',
        cell: ({ row }) => (
          <Chip
            label={row.original.tier}
            variant='tonal'
            size='small'
            color={tierColorObj[row.original.tier] || 'default'}
            className='capitalize'
          />
        )
      }),
      columnHelper.accessor('price', {
        header: 'MONTHLY PRICE',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {`${row.original.currency} ${row.original.price}`}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'STATUS',
        cell: ({ row }) => (
          <Chip
            variant='tonal'
            label={statusObj[row.original.status].title}
            size='small'
            color={statusObj[row.original.status].color}
            className='capitalize'
          />
        )
      }),
      columnHelper.display({
        id: 'actions',
        header: 'ACTIONS',
        cell: ({ row }) => (
          <OptionMenu
            iconButtonProps={{ size: 'small' }}
            options={[
              {
                text: 'View Details',
                icon: 'ri-eye-line',
                menuItemProps: { onClick: () => handleViewPlan(row.original) }
              },
              {
                text: 'Edit Plan',
                icon: 'ri-pencil-line',
                menuItemProps: { onClick: () => handleEditPlan(row.original) }
              },
              {
                text: row.original.status === 'active' ? 'Deactivate' : 'Activate',
                icon: row.original.status === 'active' ? 'ri-close-circle-line' : 'ri-checkbox-circle-line',
                menuItemProps: { onClick: () => handleToggleStatus(row.original) }
              },
              {
                text: 'Delete',
                icon: 'ri-delete-bin-line',
                menuItemProps: {
                  onClick: () => {
                    setSelectedPlan(row.original)
                    setDeletePlanOpen(true)
                  },
                  sx: { color: 'error.main' }
                }
              }
            ]}
          />
        )
      })
    ],
    [handleToggleStatus, columnHelper]
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    state: {
      rowSelection,
      globalFilter
    },
    initialState: {
      pagination: {
        pageSize: 10
      }
    },
    enableRowSelection: true,
    globalFilterFn: fuzzyFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  return (
    <>
      <Card>
        <CardHeader
          title='Subscription Plans'
          action={
            <div className='flex items-center gap-2'>
              <Button
                variant='contained'
                size='small'
                startIcon={<i className='ri-add-line' />}
                onClick={() => setAddPlanOpen(true)}
              >
                Create Plan
              </Button>
            </div>
          }
        />
        <CardContent className='flex flex-col gap-4'>
          {/* Filters */}
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div className='flex items-center gap-4'>
              <TextField
                select
                size='small'
                label='Tier'
                value={tier}
                onChange={e => setTier(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value=''>All Tiers</MenuItem>
                <MenuItem value='free'>Free</MenuItem>
                <MenuItem value='basic'>Basic</MenuItem>
                <MenuItem value='pro'>Pro</MenuItem>
                <MenuItem value='enterprise'>Enterprise</MenuItem>
              </TextField>
              <TextField
                select
                size='small'
                label='Status'
                value={status}
                onChange={e => setStatus(e.target.value)}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value=''>All Status</MenuItem>
                <MenuItem value='active'>Active</MenuItem>
                <MenuItem value='inactive'>Inactive</MenuItem>
              </TextField>
            </div>
            <TextField
              size='small'
              placeholder='Search Plans'
              value={globalFilter}
              onChange={e => setGlobalFilter(e.target.value)}
              className='max-sm:is-full'
            />
          </div>

          {/* Table */}
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
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                      No plans available
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component='div'
            className='border-bs'
            count={table.getFilteredRowModel().rows.length}
            rowsPerPage={table.getState().pagination.pageSize}
            page={table.getState().pagination.pageIndex}
            SelectProps={{
              inputProps: { 'aria-label': 'rows per page' }
            }}
            onPageChange={(_, page) => {
              table.setPageIndex(page)
            }}
            onRowsPerPageChange={e => {
              table.setPageSize(Number(e.target.value))
            }}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ViewPlanDialog
        open={viewPlanOpen}
        handleClose={() => setViewPlanOpen(false)}
        plan={selectedPlan}
      />

      <AddPlanDialog
        open={addPlanOpen || editPlanOpen}
        handleClose={() => {
          setAddPlanOpen(false)
          setEditPlanOpen(false)
          setSelectedPlan(null)
        }}
        mode={editPlanOpen ? 'edit' : 'add'}
        editData={selectedPlan}
        plansData={data}
        setData={setData}
      />

      <ConfirmationDialog
        open={deletePlanOpen}
        setOpen={setDeletePlanOpen}
        type='delete-customer'
        onConfirm={() => {
          if (selectedPlan) {
            handleDeletePlan(selectedPlan.id)
          }
        }}
      />
    </>
  )
}

export default SubscriptionPlansListTable
