'use client'

// React Imports
import { useEffect, useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import TablePagination from '@mui/material/TablePagination'
import Rating from '@mui/material/Rating'
import type { TextFieldProps } from '@mui/material/TextField'

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
import type { MaintainerType } from '@/types/maintenance/maintainerTypes'

// Component Imports
import OptionMenu from '@core/components/option-menu'
import PageBanner from '@components/banner/PageBanner'
import CustomAvatar from '@core/components/mui/Avatar'
import ConfirmationDialog from '@components/dialogs/confirmation-dialog'
import AddMaintainerDialog from './AddMaintainerDialog'
import ViewMaintainerDialog from './ViewMaintainerDialog'

// Util Imports
import { getInitials } from '@/utils/getInitials'

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

type MaintainerTypeWithAction = MaintainerType & {
  action?: string
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })
  
return itemRank.passed
}

const DebouncedInput = ({
  value: initialValue,
  onChange,
  debounce = 500,
  ...props
}: {
  value: string | number
  onChange: (value: string | number) => void
  debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value)
    }, debounce)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return <TextField {...props} value={value} onChange={e => setValue(e.target.value)} size='small' />
}

// Sample data
const sampleMaintainers: MaintainerType[] = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+233 24 123 4567',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    specialization: 'Plumbing',
    status: 'active',
    address: 'Accra, Ghana',
    rating: 4.5,
    totalJobs: 45,
    completedJobs: 42
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+233 24 234 5678',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    specialization: 'Electrical',
    status: 'active',
    address: 'Kumasi, Ghana',
    rating: 4.8,
    totalJobs: 38,
    completedJobs: 37
  },
  {
    id: 3,
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    phone: '+233 24 345 6789',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    specialization: 'HVAC',
    status: 'active',
    address: 'Tamale, Ghana',
    rating: 4.2,
    totalJobs: 52,
    completedJobs: 50
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    phone: '+233 24 456 7890',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    specialization: 'Carpentry',
    status: 'active',
    address: 'Takoradi, Ghana',
    rating: 4.7,
    totalJobs: 29,
    completedJobs: 28
  },
  {
    id: 5,
    name: 'David Wilson',
    email: 'david.wilson@example.com',
    phone: '+233 24 567 8901',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    specialization: 'Painting',
    status: 'inactive',
    address: 'Cape Coast, Ghana',
    rating: 4.0,
    totalJobs: 33,
    completedJobs: 30
  },
  {
    id: 6,
    name: 'Lisa Anderson',
    email: 'lisa.anderson@example.com',
    phone: '+233 24 678 9012',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    specialization: 'General Maintenance',
    status: 'active',
    address: 'Tema, Ghana',
    rating: 4.6,
    totalJobs: 41,
    completedJobs: 40
  },
  {
    id: 7,
    name: 'Robert Taylor',
    email: 'robert.taylor@example.com',
    phone: '+233 24 789 0123',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    specialization: 'Plumbing',
    status: 'active',
    address: 'Sunyani, Ghana',
    rating: 4.3,
    totalJobs: 36,
    completedJobs: 35
  },
  {
    id: 8,
    name: 'Jennifer Martinez',
    email: 'jennifer.martinez@example.com',
    phone: '+233 24 890 1234',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    specialization: 'Electrical',
    status: 'active',
    address: 'Ho, Ghana',
    rating: 4.9,
    totalJobs: 48,
    completedJobs: 47
  },
  {
    id: 9,
    name: 'William Garcia',
    email: 'william.garcia@example.com',
    phone: '+233 24 901 2345',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    specialization: 'HVAC',
    status: 'inactive',
    address: 'Koforidua, Ghana',
    rating: 3.8,
    totalJobs: 27,
    completedJobs: 25
  },
  {
    id: 10,
    name: 'Amanda White',
    email: 'amanda.white@example.com',
    phone: '+233 24 012 3456',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    specialization: 'Carpentry',
    status: 'active',
    address: 'Wa, Ghana',
    rating: 4.4,
    totalJobs: 31,
    completedJobs: 30
  },
  {
    id: 11,
    name: 'James Lee',
    email: 'james.lee@example.com',
    phone: '+233 24 123 7890',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    specialization: 'Painting',
    status: 'active',
    address: 'Bolgatanga, Ghana',
    rating: 4.1,
    totalJobs: 39,
    completedJobs: 37
  },
  {
    id: 12,
    name: 'Patricia Harris',
    email: 'patricia.harris@example.com',
    phone: '+233 24 234 8901',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    specialization: 'General Maintenance',
    status: 'active',
    address: 'Elmina, Ghana',
    rating: 4.7,
    totalJobs: 44,
    completedJobs: 43
  }
]

const MaintainersListTable = ({ tableData }: { tableData?: MaintainerType[] }) => {
  // States
  const [rowSelection, setRowSelection] = useState({})
  const [data, setData] = useState(tableData || sampleMaintainers)
  const [filteredData, setFilteredData] = useState(data)
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>('')
  const [deleteMaintainerOpen, setDeleteMaintainerOpen] = useState(false)
  const [selectedMaintainer, setSelectedMaintainer] = useState<MaintainerType | null>(null)
  const [addMaintainerOpen, setAddMaintainerOpen] = useState(false)
  const [editMaintainerOpen, setEditMaintainerOpen] = useState(false)
  const [maintainerToEdit, setMaintainerToEdit] = useState<MaintainerType | null>(null)
  const [viewMaintainerOpen, setViewMaintainerOpen] = useState(false)
  const [maintainerToView, setMaintainerToView] = useState<MaintainerType | null>(null)

  // Get unique specializations
  const uniqueSpecializations = useMemo(() => {
    const specs = Array.from(new Set(data.map(m => m.specialization).filter(Boolean)))

    
return specs as string[]
  }, [data])

  // Filter data
  useEffect(() => {
    let filtered = data

    if (globalFilter) {
      filtered = filtered.filter(
        maintainer =>
          maintainer.name?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          maintainer.email?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          maintainer.phone?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          maintainer.specialization?.toLowerCase().includes(globalFilter.toLowerCase()) ||
          maintainer.address?.toLowerCase().includes(globalFilter.toLowerCase())
      )
    }

    if (selectedStatus) {
      filtered = filtered.filter(maintainer => maintainer.status === selectedStatus)
    }

    if (selectedSpecialization) {
      filtered = filtered.filter(maintainer => maintainer.specialization === selectedSpecialization)
    }

    setFilteredData(filtered)
  }, [data, globalFilter, selectedStatus, selectedSpecialization])

  // Handle delete maintainer
  const handleDeleteMaintainer = (maintainerId: number) => {
    setData(data.filter(maintainer => maintainer.id !== maintainerId))
    setDeleteMaintainerOpen(false)
    setSelectedMaintainer(null)
    setRowSelection({})
  }

  const columnHelper = createColumnHelper<MaintainerTypeWithAction>()

  // Status color mapping
  const maintainerStatusObj: {
    [key: string]: {
      color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
    }
  } = {
    active: { color: 'success' },
    inactive: { color: 'warning' }
  }

  const columns = useMemo<ColumnDef<MaintainerTypeWithAction, any>[]>(
    () => [
      {
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
            indeterminate={row.getIsSomeSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        )
      },
      columnHelper.display({
        id: 'sl',
        header: 'SL',
        cell: ({ row, table }) => {
          const pageIndex = table.getState().pagination.pageIndex
          const pageSize = table.getState().pagination.pageSize

          
return <Typography>{pageIndex * pageSize + row.index + 1}.</Typography>
        }
      }),
      columnHelper.accessor('name', {
        header: 'Name',
        cell: ({ row }) => (
          <div className='flex items-center gap-3'>
            <CustomAvatar src={row.original.avatar} skin='light' size={34}>
              {getInitials(row.original.name)}
            </CustomAvatar>
            <div className='flex flex-col'>
              <Typography color='text.primary' className='font-medium'>
                {row.original.name || '-'}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {row.original.email || '-'}
              </Typography>
            </div>
          </div>
        )
      }),
      columnHelper.accessor('phone', {
        header: 'Phone',
        cell: ({ row }) => <Typography color='text.primary'>{row.original.phone || '-'}</Typography>
      }),
      columnHelper.accessor('specialization', {
        header: 'Specialization',
        cell: ({ row }) => <Chip variant='tonal' label={row.original.specialization} size='small' color='primary' />
      }),
      columnHelper.accessor('rating', {
        header: 'Rating',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <Rating value={row.original.rating || 0} readOnly size='small' precision={0.1} />
            <Typography variant='body2' color='text.secondary'>
              ({row.original.rating?.toFixed(1) || '0.0'})
            </Typography>
          </div>
        )
      }),
      columnHelper.display({
        id: 'jobs',
        header: 'Jobs',
        cell: ({ row }) => (
          <Typography color='text.primary'>
            {row.original.completedJobs || 0}/{row.original.totalJobs || 0}
          </Typography>
        )
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status
          const statusConfig = maintainerStatusObj[status] || { color: 'secondary' }

          return <Chip variant='tonal' label={status} size='small' color={statusConfig.color} className='capitalize' />
        }
      }),
      columnHelper.display({
        id: 'action',
        header: 'Action',
        cell: ({ row }) => {
          return (
            <OptionMenu
              iconButtonProps={{ size: 'small' }}
              options={[
                {
                  text: 'View',
                  icon: 'ri-eye-line',
                  menuItemProps: {
                    onClick: () => {
                      setMaintainerToView(row.original)
                      setViewMaintainerOpen(true)
                    }
                  }
                },
                {
                  text: 'Edit',
                  icon: 'ri-pencil-line',
                  menuItemProps: {
                    onClick: () => {
                      setMaintainerToEdit(row.original)
                      setEditMaintainerOpen(true)
                    }
                  }
                },
                {
                  text: 'Delete',
                  icon: 'ri-delete-bin-line',
                  menuItemProps: {
                    onClick: () => {
                      setSelectedMaintainer(row.original)
                      setDeleteMaintainerOpen(true)
                    }
                  }
                }
              ]}
            />
          )
        },
        enableSorting: false
      })
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        title='Maintainers'
        description='Manage maintenance service providers and contractors'
        icon='ri-tools-line'
      />
      <Card className='mbs-6'>
        <CardHeader
          title='Maintainers List'
          action={
            <div className='flex items-center gap-2'>
              {Object.keys(rowSelection).length > 0 && (
                <Button
                  variant='outlined'
                  color='error'
                  startIcon={<i className='ri-delete-bin-line' />}
                  onClick={() => {
                    const selectedIds = Object.keys(rowSelection)
                      .map(key => filteredData[parseInt(key)]?.id)
                      .filter(Boolean) as number[]

                    if (selectedIds.length > 0) {
                      setSelectedMaintainer({ id: selectedIds[0] } as MaintainerType)
                      setDeleteMaintainerOpen(true)
                    }
                  }}
                >
                  Delete Selected ({Object.keys(rowSelection).length})
                </Button>
              )}
              <Button
                variant='contained'
                color='primary'
                startIcon={<i className='ri-add-line' />}
                onClick={() => setAddMaintainerOpen(true)}
              >
                Add Maintainer
              </Button>
              <OptionMenu options={['Refresh', 'Share']} />
            </div>
          }
        />
        <Divider />
        <CardContent className='flex flex-col gap-4'>
          {/* Filters */}
          <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between'>
            <div className='flex flex-wrap gap-4 items-center'>
              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} label='Status'>
                  <MenuItem value=''>All Status</MenuItem>
                  <MenuItem value='active'>Active</MenuItem>
                  <MenuItem value='inactive'>Inactive</MenuItem>
                </Select>
              </FormControl>
              <FormControl size='small' sx={{ minWidth: 180 }}>
                <InputLabel>Specialization</InputLabel>
                <Select
                  value={selectedSpecialization}
                  onChange={e => setSelectedSpecialization(e.target.value)}
                  label='Specialization'
                >
                  <MenuItem value=''>All Specializations</MenuItem>
                  {uniqueSpecializations.map(spec => (
                    <MenuItem key={spec} value={spec}>
                      {spec}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <DebouncedInput
              value={globalFilter ?? ''}
              onChange={value => setGlobalFilter(String(value))}
              placeholder='Search:'
              className='sm:is-auto min-is-[200px]'
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
                  {table.getRowModel().rows.map(row => {
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

      {/* View Maintainer Dialog */}
      <ViewMaintainerDialog
        open={viewMaintainerOpen}
        setOpen={setViewMaintainerOpen}
        maintainer={maintainerToView}
        onEdit={() => {
          setViewMaintainerOpen(false)
          setMaintainerToEdit(maintainerToView)
          setEditMaintainerOpen(true)
        }}
      />

      {/* Add Maintainer Dialog */}
      <AddMaintainerDialog
        open={addMaintainerOpen}
        handleClose={() => setAddMaintainerOpen(false)}
        maintainerData={data}
        setData={setData}
        mode='add'
      />

      {/* Edit Maintainer Dialog */}
      <AddMaintainerDialog
        open={editMaintainerOpen}
        handleClose={() => {
          setEditMaintainerOpen(false)
          setMaintainerToEdit(null)
        }}
        maintainerData={data}
        setData={setData}
        editData={maintainerToEdit}
        mode='edit'
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteMaintainerOpen}
        setOpen={setDeleteMaintainerOpen}
        type='delete-maintainer'
        onConfirm={() => {
          if (selectedMaintainer) {
            const selectedIds =
              Object.keys(rowSelection).length > 0
                ? (Object.keys(rowSelection)
                    .map(key => filteredData[parseInt(key)]?.id)
                    .filter(Boolean) as number[])
                : [selectedMaintainer.id]

            if (selectedIds.length > 0) {
              setData(data.filter(maintainer => !selectedIds.includes(maintainer.id)))
              setRowSelection({})
            }

            setDeleteMaintainerOpen(false)
            setSelectedMaintainer(null)
          }
        }}
      />
    </>
  )
}

export default MaintainersListTable
