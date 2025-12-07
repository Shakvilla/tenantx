// Documentation: /docs/subscription-plans/subscription-plans-module.md

'use client'

// React Imports
import { useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import TablePagination from '@mui/material/TablePagination'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'

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

// Component Imports
import OptionMenu from '@core/components/option-menu'
import PageBanner from '@components/banner/PageBanner'
import SubscriptionPlansStatsCard from './SubscriptionPlansStatsCard'
import AddSubscriptionPlanDialog from './AddSubscriptionPlanDialog'
import ViewSubscriptionPlanDialog from './ViewSubscriptionPlanDialog'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'

// Type Imports
import type {
  SubscriptionPlan,
  SubscriptionPlanWithAction,
  PlanTier,
  PlanStatus,
  BillingCycle
} from '@/types/subscription-plans/subscriptionPlanTypes'

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

const columnHelper = createColumnHelper<SubscriptionPlanWithAction>()

// Sample data
const samplePlans: SubscriptionPlan[] = [
  {
    id: 1,
    name: 'Free Plan',
    tier: 'free',
    description: 'Perfect for getting started',
    status: 'active',
    price: '0',
    currency: '₵',
    billingCycle: 'monthly',
    trialPeriod: 0,
    maxProperties: 0,
    maxTenants: 0,
    maxUnits: 0,
    maxDocuments: 5,
    maxUsers: 1,
    features: ['Basic dashboard', 'Limited support', '5 documents'],
    isPopular: false
  },
  {
    id: 2,
    name: 'Basic Plan',
    tier: 'basic',
    description: 'Ideal for small property managers',
    status: 'active',
    price: '29',
    currency: '₵',
    billingCycle: 'monthly',
    trialPeriod: 14,
    maxProperties: 5,
    maxTenants: 20,
    maxUnits: 15,
    maxDocuments: 100,
    maxUsers: 2,
    features: ['Up to 5 properties', '20 tenants', '15 units', '100 documents', '2 users', 'Email support'],
    isPopular: false
  },
  {
    id: 3,
    name: 'Pro Plan',
    tier: 'pro',
    description: 'Best for growing businesses',
    status: 'active',
    price: '99',
    currency: '₵',
    billingCycle: 'monthly',
    trialPeriod: 14,
    maxProperties: 25,
    maxTenants: 100,
    maxUnits: 75,
    maxDocuments: 500,
    maxUsers: 5,
    features: [
      'Up to 25 properties',
      '100 tenants',
      '75 units',
      '500 documents',
      '5 users',
      'Priority support',
      'Advanced reports',
      'API access'
    ],
    isPopular: true
  },
  {
    id: 4,
    name: 'Enterprise Plan',
    tier: 'enterprise',
    description: 'For large organizations',
    status: 'active',
    price: '299',
    currency: '₵',
    billingCycle: 'monthly',
    trialPeriod: 30,
    maxProperties: -1, // unlimited
    maxTenants: -1,
    maxUnits: -1,
    maxDocuments: -1,
    maxUsers: -1,
    features: [
      'Unlimited properties',
      'Unlimited tenants',
      'Unlimited units',
      'Unlimited documents',
      'Unlimited users',
      '24/7 priority support',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee'
    ],
    isPopular: false
  }
]

const SubscriptionPlansListTable = () => {
  // States
  const [data, setData] = useState<SubscriptionPlan[]>(samplePlans)
  const [globalFilter, setGlobalFilter] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [status, setStatus] = useState<PlanStatus | ''>('')
  const [tier, setTier] = useState<PlanTier | ''>('')
  const [billingCycle, setBillingCycle] = useState<BillingCycle | ''>('')
  const [addPlanOpen, setAddPlanOpen] = useState(false)
  const [editPlanOpen, setEditPlanOpen] = useState(false)
  const [viewPlanOpen, setViewPlanOpen] = useState(false)
  const [deletePlanOpen, setDeletePlanOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)

  // Calculate stats
  const stats = useMemo(() => {
    const activePlans = data.filter(p => p.status === 'active').length
    // Mock subscription counts (in real app, these would come from API)
    const totalSubscriptions = 45
    const activeSubscriptions = 38
    const monthlyRevenue = data
      .filter(p => p.status === 'active' && p.tier !== 'free')
      .reduce((sum, p) => {
        const price = parseFloat(p.price) || 0
        return sum + price * 10 // Mock: assume 10 subscriptions per paid plan
      }, 0)

    return {
      totalPlans: data.length,
      activePlans,
      totalSubscriptions,
      activeSubscriptions,
      monthlyRecurringRevenue: `₵${monthlyRevenue.toLocaleString()}`
    }
  }, [data])

  const handleDeletePlan = (planId: number) => {
    setData(data.filter(p => p.id !== planId))
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

  const handleToggleStatus = (plan: SubscriptionPlan) => {
    setData(data.map(p => (p.id === plan.id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p)))
  }

  // Filter data
  const filteredData = useMemo(() => {
    let filtered = data

    if (status) {
      filtered = filtered.filter(p => p.status === status)
    }
    if (tier) {
      filtered = filtered.filter(p => p.tier === tier)
    }
    if (billingCycle) {
      filtered = filtered.filter(p => p.billingCycle === billingCycle)
    }

    return filtered
  }, [data, status, tier, billingCycle])

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
        cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />
      }),
      columnHelper.accessor('name', {
        header: 'PLAN NAME',
        cell: ({ row }) => (
          <div className='flex flex-col'>
            <Typography color='text.primary' className='font-medium'>
              {row.original.name}
            </Typography>
            {row.original.isPopular && (
              <Chip variant='tonal' label='Popular' size='small' color='primary' className='w-fit mts-1' />
            )}
          </div>
        )
      }),
      columnHelper.accessor('tier', {
        header: 'TIER',
        cell: ({ row }) => {
          const tierColors: Record<PlanTier, 'primary' | 'success' | 'warning' | 'info'> = {
            free: 'info',
            basic: 'primary',
            pro: 'success',
            enterprise: 'warning'
          }
          return (
            <Chip
              variant='tonal'
              label={row.original.tier}
              size='small'
              color={tierColors[row.original.tier]}
              className='capitalize'
            />
          )
        }
      }),
      columnHelper.accessor('price', {
        header: 'PRICE',
        cell: ({ row }) => (
          <Typography color='text.primary' className='font-medium'>
            {row.original.price === '0' ? 'Free' : `${row.original.currency}${row.original.price}`}
            <Typography component='span' variant='body2' color='text.secondary' className='ml-1'>
              /
              {row.original.billingCycle === 'monthly'
                ? 'mo'
                : row.original.billingCycle === 'quarterly'
                  ? 'qtr'
                  : 'yr'}
            </Typography>
          </Typography>
        )
      }),
      columnHelper.accessor('billingCycle', {
        header: 'BILLING CYCLE',
        cell: ({ row }) => <Typography className='capitalize'>{row.original.billingCycle}</Typography>
      }),
      columnHelper.accessor('status', {
        header: 'STATUS',
        cell: ({ row }) => {
          const statusColors: Record<PlanStatus, 'success' | 'warning' | 'error'> = {
            active: 'success',
            inactive: 'warning',
            archived: 'error'
          }
          return (
            <Chip
              variant='tonal'
              label={row.original.status}
              size='small'
              color={statusColors[row.original.status]}
              className='capitalize'
            />
          )
        }
      }),
      columnHelper.accessor('features', {
        header: 'FEATURES',
        cell: ({ row }) => <Typography color='text.secondary'>{row.original.features.length} features</Typography>
      }),
      columnHelper.display({
        id: 'actions',
        header: 'ACTIONS',
        cell: ({ row }) => (
          <OptionMenu
            iconButtonProps={{ size: 'small' }}
            options={[
              {
                text: 'View',
                icon: 'ri-eye-line',
                menuItemProps: {
                  onClick: () => handleViewPlan(row.original)
                }
              },
              {
                text: 'Edit',
                icon: 'ri-pencil-line',
                menuItemProps: {
                  onClick: () => handleEditPlan(row.original)
                }
              },
              {
                text: row.original.status === 'active' ? 'Deactivate' : 'Activate',
                icon: row.original.status === 'active' ? 'ri-pause-circle-line' : 'ri-play-circle-line',
                menuItemProps: {
                  onClick: () => handleToggleStatus(row.original)
                }
              },
              {
                text: 'Delete',
                icon: 'ri-delete-bin-line',
                menuItemProps: {
                  onClick: () => {
                    setSelectedPlan(row.original)
                    setDeletePlanOpen(true)
                  }
                }
              }
            ]}
          />
        )
      })
    ],
    []
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
      <PageBanner
        title='Subscription Plans'
        description='Manage subscription plans and pricing tiers'
        icon='ri-vip-crown-line'
      />
      <SubscriptionPlansStatsCard
        totalPlans={stats.totalPlans}
        activePlans={stats.activePlans}
        totalSubscriptions={stats.totalSubscriptions}
        activeSubscriptions={stats.activeSubscriptions}
        monthlyRecurringRevenue={stats.monthlyRecurringRevenue}
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Plans List'
          action={
            <div className='flex items-center gap-2'>
              <OptionMenu options={['Refresh', 'Share']} />
            </div>
          }
        />
        <CardContent className='flex flex-col gap-4'>
          {/* Filters Section */}
          <Box className='flex flex-col gap-4 p-4 rounded-lg'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-center gap-2'>
              <TextField
                select
                size='small'
                label='Status'
                value={status}
                onChange={e => setStatus(e.target.value as PlanStatus | '')}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value=''>All Status</MenuItem>
                <MenuItem value='active'>Active</MenuItem>
                <MenuItem value='inactive'>Inactive</MenuItem>
                <MenuItem value='archived'>Archived</MenuItem>
              </TextField>
              <TextField
                select
                size='small'
                label='Tier'
                value={tier}
                onChange={e => setTier(e.target.value as PlanTier | '')}
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
                label='Billing Cycle'
                value={billingCycle}
                onChange={e => setBillingCycle(e.target.value as BillingCycle | '')}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value=''>All Cycles</MenuItem>
                <MenuItem value='monthly'>Monthly</MenuItem>
                <MenuItem value='quarterly'>Quarterly</MenuItem>
                <MenuItem value='yearly'>Yearly</MenuItem>
              </TextField>
            </div>
            <Divider />

            <div className='flex items-center justify-between gap-2'>
              <div>
                <TextField
                  size='small'
                  placeholder='Search'
                  value={globalFilter}
                  onChange={e => setGlobalFilter(e.target.value)}
                  className='flex-1 min-w-[200px]'
                />
              </div>

              <div className='flex items-center gap-2 ml-auto'>
                <TextField
                  select
                  size='small'
                  value={table.getState().pagination.pageSize}
                  onChange={e => table.setPageSize(Number(e.target.value))}
                  sx={{ minWidth: 100 }}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </TextField>
                <Button variant='outlined' size='small' startIcon={<i className='ri-upload-2-line' />}>
                  Export
                </Button>
                <Button
                  variant='contained'
                  color='primary'
                  size='small'
                  startIcon={<i className='ri-add-line' />}
                  onClick={() => setAddPlanOpen(true)}
                >
                  Add Plan
                </Button>
              </div>
            </div>
          </Box>

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
              {table.getFilteredRowModel().rows.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                      No data available
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {table
                    .getRowModel()
                    .rows.slice(0, table.getState().pagination.pageSize)
                    .map(row => {
                      return (
                        <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                          ))}
                        </tr>
                      )
                    })}
                </tbody>
              )}
            </table>
          </div>
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
            onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
          />
        </CardContent>
      </Card>

      {/* Add Plan Dialog */}
      <AddSubscriptionPlanDialog
        open={addPlanOpen}
        handleClose={() => setAddPlanOpen(false)}
        plansData={data}
        setData={setData}
        mode='add'
      />

      {/* Edit Plan Dialog */}
      <AddSubscriptionPlanDialog
        open={editPlanOpen}
        handleClose={() => {
          setEditPlanOpen(false)
          setSelectedPlan(null)
        }}
        plansData={data}
        setData={setData}
        editData={selectedPlan}
        mode='edit'
      />

      {/* View Plan Dialog */}
      <ViewSubscriptionPlanDialog
        open={viewPlanOpen}
        handleClose={() => {
          setViewPlanOpen(false)
          setSelectedPlan(null)
        }}
        plan={selectedPlan}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deletePlanOpen}
        setOpen={setDeletePlanOpen}
        type='delete-tenant'
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
