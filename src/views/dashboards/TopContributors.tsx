'use client'

// Next Imports
import { useMemo } from 'react'

import dynamic from 'next/dynamic'

// React Imports

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import { useTheme , styled } from '@mui/material/styles'
import Chip from '@mui/material/Chip'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import { rankItem } from '@tanstack/match-sorter-utils'
import type { RankingInfo } from '@tanstack/match-sorter-utils'

// Type Imports
import type { ContributorData } from '@/types/dashboards/dashboardTypes'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import OptionMenu from '@core/components/option-menu'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

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


// Vars
const barSeries = [
  {
    name: 'Contribution',
    data: [10080, 9409, 3588, 1500, 1300]
  }
]

// Sample data - replace with actual data from API
const contributorsData: ContributorData[] = [
  { name: 'Pearl', agent: 'Agent Admin', contribution: 10080.0 },
  { name: 'Kenneth Quaye', agent: 'Dolph', contribution: 9409.0 },
  { name: 'Ama Bessah na', agent: 'Emmanuel Ani', contribution: 3588.0 },
  { name: 'Alex Bonney', agent: 'Agent Admin', contribution: 1500.0 },
  { name: 'Wiredu Kwabena', agent: '', contribution: 1300.0 }
]

const StyledCard = styled(Card)(() => ({
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, var(--mui-palette-info-main), var(--mui-palette-info-light))',
    borderRadius: '4px 4px 0 0'
  }
}))

const TopContributors = () => {
  // Hooks
  // const theme = useTheme()

  // Bar Chart Options
  const barOptions: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      sparkline: { enabled: true }
    },
    grid: {
      show: false,
      padding: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }
    },
    legend: { show: false },
    dataLabels: { enabled: false },
    colors: ['var(--mui-palette-info-main)'],
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '60%',
        borderRadiusApplication: 'end',
        distributed: true
      }
    },
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false },
      categories: contributorsData.map(c => c.name)
    },
    yaxis: {
      labels: { show: false }
    }
  }

  // Table Column Definitions
  const columnHelper = createColumnHelper<ContributorData>()

  const columns = useMemo<ColumnDef<ContributorData, any>[]>(
    () => [
      columnHelper.accessor('name', {
        header: 'NAME',
        cell: ({ row }) => (
          <div className='flex items-center gap-2'>
            <CustomAvatar skin='light' color='primary' size={36}>
              {getInitials(row.original.name)}
            </CustomAvatar>
            <div className='flex flex-col gap-0.5'>
              <Typography color='text.primary' className='font-semibold text-sm'>
                {row.original.name}
              </Typography>
              {row.original.agent && (
                <Typography variant='body2' color='text.secondary' className='text-xs'>
                  {row.original.agent}
                </Typography>
              )}
            </div>
          </div>
        )
      }),
      columnHelper.accessor('contribution', {
        header: 'CONTRIBUTION',
        cell: ({ row }) => {
          const formatted = `GH₵ ${row.original.contribution.toLocaleString('en-GH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}`

          return (
            <Chip
              label={formatted}
              color='success'
              variant='tonal'
              size='small'
              className='font-semibold'
            />
          )
        }
      })
    ],
    []
  )

  const table = useReactTable({
    data: contributorsData,
    columns,
    filterFns: {
      fuzzy: fuzzyFilter
    },
    getCoreRowModel: getCoreRowModel()
  })

  return (
    <StyledCard className='bs-full'>
      <CardHeader
        title='Top 50 Contributors'
        action={<OptionMenu options={['Refresh', 'Export', 'Share']} />}
      />
      <CardContent className='flex flex-col gap-4'>
        <div className='bs-[80px] rounded-lg overflow-hidden' style={{ backgroundColor: 'var(--mui-palette-info-lightOpacity)' }}>
          <AppReactApexCharts type='bar' height={80} width='100%' options={barOptions} series={barSeries} />
        </div>
        <div className='overflow-x-auto'>
          <table className={tableStyles.table}>
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : (
                        <div>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </StyledCard>
  )
}

export default TopContributors
