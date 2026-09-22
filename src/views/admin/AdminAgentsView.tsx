'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Divider from '@mui/material/Divider'
import Snackbar from '@mui/material/Snackbar'

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'

import {
  getAdminAgentProfiles,
  suspendAdminAgentProfile,
  reinstateAdminAgentProfile,
  getAdminAgentReferrals,
  getAdminAgentRelationships,
  forceEndAdminAgentRelationship,
  getAdminAgentAudit,
  type AdminAgentProfile,
  type AdminAgentReferral,
  type AdminAgentRelationship,
  type AdminAgentAuditEvent,
} from '@/lib/api/admin-auth-client'
import { fuzzyFilter } from '@/utils/tableFilterFns'

const profileHelper = createColumnHelper<AdminAgentProfile>()
const referralHelper = createColumnHelper<AdminAgentReferral>()
const relationshipHelper = createColumnHelper<AdminAgentRelationship>()

const statusColor = (status: string): 'default' | 'info' | 'warning' | 'success' | 'error' => {
  if (status === 'ACTIVE' || status === 'ACCEPTED') return 'success'
  if (status === 'SUSPENDED' || status === 'REVOKED') return 'error'
  if (status === 'PENDING_APPROVAL' || status === 'PENDING' || status === 'SENT' || status === 'OPENED') return 'warning'
  if (status === 'INVITED') return 'info'
  
return 'default'
}

function useTable<T>(data: T[], columns: ColumnDef<T, any>[]) {
  const [globalFilter, setGlobalFilter] = useState('')

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

  return { table, globalFilter, setGlobalFilter }
}

function DataTable<T>({ table }: { table: ReturnType<typeof useTable<T>>['table'] }) {
  return (
    <div className={tableStyles.tableContainer}>
      <table className={tableStyles.table}>
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(h => (
                <th key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</th>
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
  )
}

export default function AdminAgentsView() {
  const [tab, setTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState<string | null>(null)

  const [profiles, setProfiles] = useState<AdminAgentProfile[]>([])
  const [referrals, setReferrals] = useState<AdminAgentReferral[]>([])
  const [relationships, setRelationships] = useState<AdminAgentRelationship[]>([])
  const [audit, setAudit] = useState<AdminAgentAuditEvent[]>([])

  const [profileFilter, setProfileFilter] = useState('')
  const [referralFilter, setReferralFilter] = useState('')
  const [relationshipTenant, setRelationshipTenant] = useState('')
  const [auditTarget, setAuditTarget] = useState('')
  const [auditKind, setAuditKind] = useState<'relationshipId' | 'profileId' | 'mandateId'>('relationshipId')

  const [action, setAction] = useState<{ kind: 'suspend' | 'force-end'; id: string; name: string } | null>(null)
  const [reason, setReason] = useState('')
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [p, r, rel] = await Promise.all([
        getAdminAgentProfiles(profileFilter || undefined),
        getAdminAgentReferrals(referralFilter || undefined),
        getAdminAgentRelationships(relationshipTenant || undefined)
      ])

      setProfiles(Array.isArray(p) ? p : [])
      setReferrals(Array.isArray(r) ? r : [])
      setRelationships(Array.isArray(rel) ? rel : [])
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Could not load agent data')
    } finally {
      setLoading(false)
    }
  }, [profileFilter, referralFilter, relationshipTenant])

  useEffect(() => {
    load()
  }, [load])

  const loadAudit = async () => {
    if (!auditTarget.trim()) {
      setSnackbar('Enter a relationship, profile or mandate ID')

      return
    }

    try {
      const events = await getAdminAgentAudit({ [auditKind]: auditTarget.trim() })

      setAudit(Array.isArray(events) ? events : [])
      if (events.length === 0) setSnackbar('No audit events found')
    } catch (e: any) {
      setSnackbar(e?.response?.data?.message ?? e?.message ?? 'Could not load audit trail')
    }
  }

  const handleAction = async () => {
    if (!action) return

    if (!reason.trim()) {
      setSnackbar('A reason is required — it becomes the audit record')

      return
    }

    setActing(true)

    try {
      if (action.kind === 'suspend') {
        await suspendAdminAgentProfile(action.id, reason.trim())
        setSnackbar('Profile suspended platform-wide. Reinstatement is a separate deliberate act.')
      } else {
        await forceEndAdminAgentRelationship(action.id, reason.trim())
        setSnackbar('Relationship force-ended. History is retained.')
      }

      setAction(null)
      setReason('')
      load()
    } catch (e: any) {
      setSnackbar(e?.response?.data?.message ?? e?.message ?? 'Action failed')
    } finally {
      setActing(false)
    }
  }

  const handleReinstate = async (id: string, name: string) => {
    try {
      await reinstateAdminAgentProfile(id)
      setSnackbar(`Profile reinstated for ${name}`)
      load()
    } catch (e: any) {
      setSnackbar(e?.response?.data?.message ?? e?.message ?? 'Could not reinstate profile')
    }
  }

  const profileColumns = [
    profileHelper.accessor('publicName', { header: 'Agent' }),
    profileHelper.accessor('profileType', { header: 'Type' }),
    profileHelper.accessor('identityStatus', {
      header: 'Identity',
      cell: info => <Chip size='small' label={info.getValue()} color={info.getValue() === 'VERIFIED' ? 'success' : 'default'} />
    }),
    profileHelper.accessor('credentialStatus', {
      header: 'Credential',
      cell: info => <Chip size='small' label={info.getValue()} color={info.getValue() === 'VERIFIED' ? 'success' : 'default'} />
    }),
    profileHelper.accessor('platformStatus', {
      header: 'Platform',
      cell: info => <Chip size='small' label={info.getValue()} color={statusColor(info.getValue())} />
    }),
    profileHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {row.original.platformStatus === 'SUSPENDED' ? (
            <Button size='small' onClick={() => handleReinstate(row.original.profileId, row.original.publicName)}>
              Reinstate
            </Button>
          ) : (
            <Button
              size='small'
              color='error'
              onClick={() => setAction({ kind: 'suspend', id: row.original.profileId, name: row.original.publicName })}
            >
              Suspend
            </Button>
          )}
        </Box>
      )
    })
  ]

  const referralColumns = [
    referralHelper.accessor('landlordName', { header: 'Landlord' }),
    referralHelper.accessor('contactMasked', { header: 'Contact' }),
    referralHelper.accessor('status', {
      header: 'Status',
      cell: info => <Chip size='small' label={info.getValue()} color={statusColor(info.getValue())} />
    }),
    referralHelper.accessor('consentAttestation', { header: 'Consent' })
  ]

  const relationshipColumns = [
    relationshipHelper.accessor('displayName', { header: 'Agent' }),
    relationshipHelper.accessor('tenantId', { header: 'Workspace' }),
    relationshipHelper.accessor('status', {
      header: 'Status',
      cell: info => <Chip size='small' label={info.getValue()} color={statusColor(info.getValue())} />
    }),
    relationshipHelper.accessor('claimed', { header: 'Claimed' }),
    relationshipHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) =>
        row.original.status !== 'ENDED' ? (
          <Button
            size='small'
            color='error'
            onClick={() => setAction({ kind: 'force-end', id: row.original.relationshipId, name: row.original.displayName })}
          >
            Force end
          </Button>
        ) : null
    })
  ]

  const auditColumns: ColumnDef<AdminAgentAuditEvent, any>[] = [
    { accessorKey: 'action', header: 'Action' },
    { accessorKey: 'targetType', header: 'Target' },
    { accessorKey: 'createdAt', header: 'At' }
  ]

  const profilesTable = useTable(profiles, profileColumns)
  const referralsTable = useTable(referrals, referralColumns)
  const relationshipsTable = useTable(relationships, relationshipColumns)
  const auditTable = useTable(audit, auditColumns)

  return (
    <Box>
      <Typography variant='h5' sx={{ mb: 1 }}>Agents</Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
        Duplicate profiles, referral abuse, claim disputes, suspensions and audit trails.
        Contacts stay masked; credential evidence is never shown.
      </Typography>

      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label={`Profiles (${profiles.length})`} />
        <Tab label={`Referrals (${referrals.length})`} />
        <Tab label={`Relationships (${relationships.length})`} />
        <Tab label='Audit trail' />
      </Tabs>
      <Divider sx={{ mb: 2 }} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {tab === 0 && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size='small'
                    label='Platform status filter'
                    placeholder='ACTIVE, SUSPENDED…'
                    value={profileFilter}
                    onChange={e => setProfileFilter(e.target.value.toUpperCase())}
                  />
                  <TextField
                    size='small'
                    placeholder='Search…'
                    value={profilesTable.globalFilter}
                    onChange={e => profilesTable.setGlobalFilter(e.target.value)}
                  />
                </Box>
                <DataTable table={profilesTable.table} />
              </CardContent>
            </Card>
          )}

          {tab === 1 && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size='small'
                    label='Status filter'
                    placeholder='SENT, ACCEPTED…'
                    value={referralFilter}
                    onChange={e => setReferralFilter(e.target.value.toUpperCase())}
                  />
                  <TextField
                    size='small'
                    placeholder='Search…'
                    value={referralsTable.globalFilter}
                    onChange={e => referralsTable.setGlobalFilter(e.target.value)}
                  />
                </Box>
                <DataTable table={referralsTable.table} />
              </CardContent>
            </Card>
          )}

          {tab === 2 && (
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size='small'
                    label='Workspace (tenant ID)'
                    value={relationshipTenant}
                    onChange={e => setRelationshipTenant(e.target.value)}
                  />
                  <TextField
                    size='small'
                    placeholder='Search…'
                    value={relationshipsTable.globalFilter}
                    onChange={e => relationshipsTable.setGlobalFilter(e.target.value)}
                  />
                </Box>
                <DataTable table={relationshipsTable.table} />
              </CardContent>
            </Card>
          )}

          {tab === 3 && (
            <Card>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <TextField
                    size='small'
                    select
                    SelectProps={{ native: true }}
                    label='ID kind'
                    value={auditKind}
                    onChange={e => setAuditKind(e.target.value as typeof auditKind)}
                  >
                    <option value='relationshipId'>Relationship</option>
                    <option value='profileId'>Profile</option>
                    <option value='mandateId'>Mandate</option>
                  </TextField>
                  <TextField
                    size='small'
                    label='ID'
                    value={auditTarget}
                    onChange={e => setAuditTarget(e.target.value)}
                    sx={{ minWidth: 300 }}
                  />
                  <Button variant='contained' onClick={loadAudit}>
                    Load trail
                  </Button>
                </Box>
                {audit.length > 0 && <DataTable table={auditTable.table} />}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={!!action} onClose={() => setAction(null)} fullWidth maxWidth='sm'>
        <DialogTitle>
          {action?.kind === 'suspend' ? `Suspend ${action?.name}?` : `Force-end relationship for ${action?.name}?`}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            {action?.kind === 'suspend'
              ? 'Suspension overrides every mandate immediately, platform-wide. History is retained; reinstatement is separate.'
              : 'Ends access on the next request and deactivates agent-only workspace links. History is retained.'}
          </Typography>
          <TextField
            label='Reason (becomes the audit record)'
            value={reason}
            onChange={e => setReason(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAction(null)}>Cancel</Button>
          <Button variant='contained' color='error' onClick={handleAction} disabled={acting}>
            {acting ? 'Working…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snackbar} autoHideDuration={5000} onClose={() => setSnackbar(null)} message={snackbar ?? ''} />
    </Box>
  )
}
