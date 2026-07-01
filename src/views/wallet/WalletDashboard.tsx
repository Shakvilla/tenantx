'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

// MUI
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import TablePagination from '@mui/material/TablePagination'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Skeleton from '@mui/material/Skeleton'

// TanStack Table
import classnames from 'classnames'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

// Style Imports
import tableStyles from '@core/styles/table.module.css'

// API + Types
import { walletApi } from '@/lib/api/wallet'
import type { WalletResponse, LedgerEntryResponse, LedgerCategory, MomoNetwork } from '@/types/wallet'
import { CATEGORY_LABELS, MOMO_NETWORKS } from '@/types/wallet'

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(n)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })

const categoryChipColor = (cat: LedgerCategory): 'success' | 'error' | 'warning' | 'default' => {
  if (cat.endsWith('_COLLECTED') || cat === 'ADMIN_CREDIT' || cat.endsWith('_REVERSAL')) return 'success'
  if (cat === 'PLATFORM_FEE' || cat === 'REFUND_ISSUED' || cat === 'ADMIN_DEBIT') return 'error'
  if (cat === 'WITHDRAWAL_INITIATED') return 'warning'
  return 'default'
}

// ─────────────────────────────────────────
// Wallet Summary Card (top hero strip)
// ─────────────────────────────────────────

const WalletSummaryCard = ({
  wallet,
  loading,
  onWithdraw
}: {
  wallet: WalletResponse | null
  loading: boolean
  onWithdraw: () => void
}) => {
  const isActive = wallet?.status === 'ACTIVE'

  return (
    <Card sx={{ mb: 4, overflow: 'hidden' }}>
      <Grid container>
        {/* ── Left: Available Balance ── */}
        <Grid
          size={{ xs: 12, md: 5 }}
          sx={{
            background: 'linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-primary-light) 100%)',
            position: 'relative',
            overflow: 'hidden',
            p: { xs: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 180,
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
              pointerEvents: 'none',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '-50%',
              right: '-10%',
              width: 240,
              height: 240,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '50%',
              pointerEvents: 'none',
            },
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <i className='ri-wallet-3-line' style={{ color: 'var(--mui-palette-common-white)', fontSize: 16 }} />
              <Typography variant='caption' sx={{ color: 'var(--mui-palette-common-white)', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                Available Balance
              </Typography>
            </div>
            {loading ? (
              <>
                <Skeleton variant='text' width={180} height={52} sx={{ bgcolor: 'rgba(var(--mui-palette-common-whiteChannel) / 0.2)' }} />
                <Skeleton variant='text' width={130} height={20} sx={{ bgcolor: 'rgba(var(--mui-palette-common-whiteChannel) / 0.15)', mt: 0.5 }} />
              </>
            ) : (
              <>
                <Typography variant='h3' fontWeight={800} sx={{ color: 'var(--mui-palette-common-white)', lineHeight: 1.1, my: 1 }}>
                  {fmt(wallet?.balance ?? 0)}
                </Typography>
                <Typography variant='body2' sx={{ color: 'var(--mui-palette-common-white)', position: 'relative', zIndex: 1 }}>
                  {wallet?.pendingBalance && wallet.pendingBalance > 0
                    ? `+ ${fmt(wallet.pendingBalance)} collecting…`
                    : wallet?.currency ?? 'GHS'}
                </Typography>
              </>
            )}
          </div>

          <Button
            variant='contained'
            size='medium'
            onClick={onWithdraw}
            disabled={!isActive || (wallet?.balance ?? 0) <= 0}
            startIcon={<i className='ri-arrow-up-circle-line' />}
            sx={{
              mt: 2,
              alignSelf: 'flex-start',
              bgcolor: '#ffffff !important',
              color: 'var(--mui-palette-primary-dark, var(--mui-palette-primary-main)) !important',
              fontWeight: 700,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#f0f0f0 !important', boxShadow: 'none' },
              '&.Mui-disabled': { bgcolor: 'rgba(255,255,255,0.55) !important', color: 'rgba(255,255,255,0.9) !important' },
            }}
          >
            Withdraw to MoMo
          </Button>
        </Grid>

        {/* ── Right: Stats grid ── */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Grid container sx={{ height: '100%' }}>
            {[
              {
                label: 'Pending',
                value: loading ? null : fmt(wallet?.pendingBalance ?? 0),
                icon: 'ri-time-line',
                iconColor: '#f59e0b',
                iconBg: '#fffbeb',
                hint: 'Payments being collected',
              },
              {
                label: 'Total Earned',
                value: loading ? null : fmt(wallet?.totalEarned ?? 0),
                icon: 'ri-arrow-down-circle-line',
                iconColor: '#16a34a',
                iconBg: '#f0fdf4',
                hint: 'Lifetime income received',
              },
              {
                label: 'Total Withdrawn',
                value: loading ? null : fmt(wallet?.totalWithdrawn ?? 0),
                icon: 'ri-arrow-up-circle-line',
                iconColor: '#dc2626',
                iconBg: '#fef2f2',
                hint: 'Lifetime cashouts',
              },
              {
                label: 'MoMo Linked',
                value: loading ? null : (wallet?.linkedMomoNumber ?? 'Not set'),
                icon: 'ri-smartphone-line',
                iconColor: '#7c3aed',
                iconBg: '#f5f3ff',
                hint: wallet?.linkedMomoNetwork ?? 'Add a withdrawal number',
              },
            ].map((stat, i) => (
              <Grid
                key={stat.label}
                size={{ xs: 6 }}
                sx={{
                  p: 3,
                  borderLeft: { md: '1px solid' },
                  borderTop: i >= 2 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: stat.iconBg,
                  }}
                >
                  <i className={stat.icon} style={{ fontSize: 20, color: stat.iconColor }} />
                </Box>
                <div style={{ minWidth: 0 }}>
                  <Typography variant='caption' color='text.secondary' sx={{ textTransform: 'uppercase', letterSpacing: 0.6, fontSize: '0.68rem' }}>
                    {stat.label}
                  </Typography>
                  {stat.value === null ? (
                    <Skeleton variant='text' width={100} height={28} />
                  ) : (
                    <Typography variant='subtitle1' fontWeight={700} noWrap>
                      {stat.value}
                    </Typography>
                  )}
                  <Typography variant='caption' color='text.disabled' noWrap>
                    {stat.hint}
                  </Typography>
                </div>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Card>
  )
}

// ─────────────────────────────────────────
// Withdraw Dialog
// ─────────────────────────────────────────

const WithdrawDialog = ({
  open,
  wallet,
  onClose,
  onSuccess
}: {
  open: boolean
  wallet: WalletResponse | null
  onClose: () => void
  onSuccess: () => void
}) => {
  const [amount, setAmount]   = useState('')
  const [network, setNetwork] = useState<MomoNetwork>('MTN')
  const [number, setNumber]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const maxAmount = wallet?.balance ?? 0

  useEffect(() => {
    if (open && wallet?.linkedMomoNumber) {
      setNumber(wallet.linkedMomoNumber)
      if (wallet.linkedMomoNetwork) setNetwork(wallet.linkedMomoNetwork as MomoNetwork)
    }
  }, [open, wallet])

  const handleSubmit = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0)    { setError('Enter a valid amount'); return }
    if (amt > maxAmount)     { setError(`Max available: ${fmt(maxAmount)}`); return }
    if (!number.match(/^0[2-9]\d{7}$/)) { setError('Enter a valid 10-digit Ghanaian number'); return }

    setLoading(true)
    setError('')
    try {
      await walletApi.requestWithdrawal({ amount: amt, momoNumber: number, momoNetwork: network })
      setAmount('')
      onSuccess()
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Withdrawal failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <div className='flex items-center gap-2'>
          <i className='ri-arrow-up-circle-line' style={{ color: '#1976d2', fontSize: 22 }} />
          Withdraw Funds
        </div>
      </DialogTitle>
      <Divider />
      <DialogContent>
        <div className='flex flex-col gap-4 pt-3'>
          <TextField
            fullWidth size='small'
            label='Amount (GHS)'
            type='number'
            value={amount}
            onChange={e => setAmount(e.target.value)}
            helperText={`Available: ${fmt(maxAmount)}`}
            slotProps={{ input: { startAdornment: <InputAdornment position='start'>₵</InputAdornment> } }}
          />
          <FormControl fullWidth size='small'>
            <InputLabel>Network</InputLabel>
            <Select value={network} label='Network' onChange={e => setNetwork(e.target.value as MomoNetwork)}>
              {MOMO_NETWORKS.map(n => (
                <MenuItem key={n.value} value={n.value}>{n.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth size='small'
            label='MoMo Number'
            value={number}
            onChange={e => setNumber(e.target.value)}
            placeholder='0241234567'
          />
          {error && <Alert severity='error' sx={{ py: 0.5 }}>{error}</Alert>}
        </div>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={loading} color='inherit'>Cancel</Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color='inherit' /> : <i className='ri-send-plane-line' />}
        >
          {loading ? 'Processing…' : 'Withdraw'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ─────────────────────────────────────────
// Ledger Table
// ─────────────────────────────────────────

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as LedgerCategory[]

const columnHelper = createColumnHelper<LedgerEntryResponse>()

const LedgerTable = () => {
  const [entries, setEntries]     = useState<LedgerEntryResponse[]>([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(0)
  const [pageSize, setPageSize]   = useState(10)
  const [loading, setLoading]     = useState(false)

  // Filters
  const [search, setSearch]               = useState('')
  const [typeFilter, setTypeFilter]       = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [dateFrom, setDateFrom]           = useState('')
  const [dateTo, setDateTo]               = useState('')

  const load = useCallback((p: number, from = dateFrom, to = dateTo, catOverride?: string) => {
    setLoading(true)
    const cat = catOverride !== undefined ? catOverride : categoryFilter
    walletApi.getLedger({ page: p, size: pageSize, from: from || undefined, to: to || undefined, category: cat || undefined })
      .then(res => { setEntries(res.entries); setTotal(res.totalElements) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [pageSize, dateFrom, dateTo, categoryFilter])

  useEffect(() => { load(0) }, [load])

  // Client-side filter for search / type / category on current page
  const filtered = useMemo(() => entries.filter(e => {
    if (typeFilter && e.entryType !== typeFilter) return false
    if (categoryFilter && e.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (e.description ?? '').toLowerCase().includes(q) ||
        (e.occupantName ?? '').toLowerCase().includes(q) ||
        (e.invoiceNumber ?? '').toLowerCase().includes(q) ||
        (e.propertyName ?? '').toLowerCase().includes(q)
      )
    }
    return true
  }), [entries, typeFilter, categoryFilter, search])

  const columns = useMemo<ColumnDef<LedgerEntryResponse, any>[]>(() => [
    columnHelper.accessor('effectiveDate', {
      header: 'DATE',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
          {fmtDate(row.original.effectiveDate)}
        </Typography>
      )
    }),
    columnHelper.accessor('description', {
      header: 'DESCRIPTION',
      cell: ({ row }) => (
        <div style={{ maxWidth: 260 }}>
          <Typography variant='body2' noWrap title={row.original.description ?? ''}>
            {row.original.description ?? '—'}
          </Typography>
          {row.original.invoiceNumber && (
            <Typography variant='caption' color='text.disabled'>{row.original.invoiceNumber}</Typography>
          )}
        </div>
      )
    }),
    columnHelper.accessor('category', {
      header: 'CATEGORY',
      cell: ({ row }) => (
        <Chip
          size='small'
          label={CATEGORY_LABELS[row.original.category]}
          color={categoryChipColor(row.original.category)}
          variant='tonal'
          sx={{ fontSize: '0.7rem' }}
        />
      )
    }),
    columnHelper.accessor('occupantName', {
      header: 'OCCUPANT / UNIT',
      cell: ({ row }) => (
        <div>
          <Typography variant='body2'>{row.original.occupantName ?? '—'}</Typography>
          {row.original.unitNumber && (
            <Typography variant='caption' color='text.disabled'>Unit {row.original.unitNumber}</Typography>
          )}
        </div>
      )
    }),
    columnHelper.accessor('amount', {
      header: 'AMOUNT',
      cell: ({ row }) => (
        <Typography
          variant='body2' fontWeight={700}
          color={row.original.entryType === 'CREDIT' ? 'success.main' : 'error.main'}
          sx={{ whiteSpace: 'nowrap' }}
        >
          {row.original.entryType === 'CREDIT' ? '+' : '−'}&thinsp;{fmt(row.original.amount)}
        </Typography>
      )
    }),
    columnHelper.accessor('runningBalance', {
      header: 'BALANCE',
      cell: ({ row }) => (
        <Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'nowrap' }}>
          {fmt(row.original.runningBalance)}
        </Typography>
      )
    }),
  ], [])

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
  })

  const handleApply = () => { setPage(0); load(0, dateFrom, dateTo) }
  const handleClear = () => {
    setSearch(''); setTypeFilter(''); setCategoryFilter(''); setDateFrom(''); setDateTo('')
    setPage(0); load(0, '', '')
  }

  return (
    <Card className='mbs-6'>
      <CardHeader
        title='Transaction Ledger'
        action={
          <div className='flex items-center gap-2'>
            <Button size='small' startIcon={<i className='ri-refresh-line' />} onClick={() => load(page)}>
              Refresh
            </Button>
            <Button size='small' variant='outlined' startIcon={<i className='ri-upload-2-line' />}>
              Export
            </Button>
          </div>
        }
      />
      <CardContent className='flex flex-col gap-4'>
        {/* Quick-filter chips — gap-fl1: make platform fees discoverable */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pt: 1 }}>
          <Typography variant='caption' color='text.secondary' sx={{ alignSelf: 'center', mr: 0.5 }}>
            Quick filter:
          </Typography>
          {[
            { label: 'All transactions', value: '' },
            { label: '🧾 Platform fees', value: 'PLATFORM_FEE' },
            { label: '💸 Withdrawals', value: 'WITHDRAWAL_INITIATED' },
            { label: '✅ Rent collected', value: 'RENT_COLLECTED' },
          ].map(f => (
            <Chip
              key={f.value}
              label={f.label}
              size='small'
              variant={categoryFilter === f.value ? 'filled' : 'outlined'}
              color={categoryFilter === f.value ? 'primary' : 'default'}
              onClick={() => {
                setCategoryFilter(f.value)
                load(0, dateFrom, dateTo, f.value)
                setPage(0)
              }}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>
        {categoryFilter === 'PLATFORM_FEE' && (
          <Alert severity='info' icon={<i className='ri-information-line' />} sx={{ py: 0.5 }}>
            Showing platform transaction fees deducted from your rent collections. These are charged per successful payment.
          </Alert>
        )}

        {/* Filter Section */}
        <Box className='flex flex-col gap-4 p-4 rounded-lg'>
          {/* Row 1: dropdown + date filters */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-center gap-2'>
            <TextField
              select size='small' label='Transaction Type' value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)} sx={{ minWidth: 160 }}
            >
              <MenuItem value=''>All Types</MenuItem>
              <MenuItem value='CREDIT'>Credit (Money In)</MenuItem>
              <MenuItem value='DEBIT'>Debit (Money Out)</MenuItem>
            </TextField>
            <TextField
              select size='small' label='Category' value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)} sx={{ minWidth: 160 }}
            >
              <MenuItem value=''>All Categories</MenuItem>
              {ALL_CATEGORIES.map(cat => (
                <MenuItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</MenuItem>
              ))}
            </TextField>
            <TextField
              size='small' label='Date From' type='date' value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              size='small' label='Date To' type='date' value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </div>
          <Divider />
          {/* Row 2: search + page size + actions */}
          <div className='flex items-center justify-between gap-2'>
            <TextField
              size='small'
              placeholder='Search by description, occupant, invoice…'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='flex-1 min-w-[200px]'
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton size='small' edge='end'>
                        <i className='ri-search-line' />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
            <div className='flex items-center gap-2 ml-auto'>
              <TextField
                select size='small' value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(0) }}
                sx={{ minWidth: 80 }}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </TextField>
              <Button size='small' variant='outlined' color='inherit' onClick={handleClear}
                startIcon={<i className='ri-close-line' />}>
                Clear
              </Button>
              <Button size='small' variant='contained' onClick={handleApply}
                startIcon={<i className='ri-filter-3-line' />}>
                Apply
              </Button>
            </div>
          </div>
        </Box>

        {/* Table */}
        <div className='overflow-x-auto'>
          {loading ? (
            <Box className='flex justify-center items-center py-10'>
              <CircularProgress />
            </Box>
          ) : (
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
              {filtered.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                      {search || typeFilter || categoryFilter || dateFrom || dateTo
                        ? 'No transactions match your filters'
                        : 'No transactions yet'}
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
          )}
        </div>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          className='border-bs'
          count={total}
          rowsPerPage={pageSize}
          page={page}
          onPageChange={(_, p) => { setPage(p); load(p) }}
          onRowsPerPageChange={e => { setPageSize(Number(e.target.value)); setPage(0) }}
        />
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────
// Root Dashboard
// ─────────────────────────────────────────

const WalletDashboard = () => {
  const [wallet, setWallet]         = useState<WalletResponse | null>(null)
  const [loading, setLoading]       = useState(true)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [snackbar, setSnackbar]     = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  })

  const loadWallet = () => {
    setLoading(true)
    walletApi.getWallet()
      .then(setWallet)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadWallet() }, [])

  return (
    <Box sx={{ mt: 6 }}>
      <WalletSummaryCard
        wallet={wallet}
        loading={loading}
        onWithdraw={() => setWithdrawOpen(true)}
      />

      {wallet && wallet.status !== 'ACTIVE' && (
        <Alert
          severity='error'
          icon={<i className='ri-lock-2-line' style={{ fontSize: '1.2rem' }} />}
          sx={{ mb: 3 }}
        >
          <strong>
            {wallet.status === 'FROZEN' ? 'Wallet frozen' : 'Wallet suspended'}
          </strong>
          {' — '}
          {wallet.status === 'FROZEN'
            ? 'Your wallet has been frozen by the platform. Incoming payments will not be credited and withdrawals are disabled. Please contact support to resolve this.'
            : 'Your wallet has been suspended. Withdrawals are currently disabled. Please contact support for assistance.'}
        </Alert>
      )}

      <LedgerTable />

      <WithdrawDialog
        open={withdrawOpen}
        wallet={wallet}
        onClose={() => setWithdrawOpen(false)}
        onSuccess={() => {
          setSnackbar({ open: true, message: 'Withdrawal initiated — funds will arrive shortly', severity: 'success' })
          loadWallet()
        }}
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
    </Box>
  )
}

export default WalletDashboard
