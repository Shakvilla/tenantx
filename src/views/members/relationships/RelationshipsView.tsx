'use client'

import { useEffect, useState, useCallback } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Snackbar from '@mui/material/Snackbar'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'

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
import type { FilterFn } from '@tanstack/react-table'

import MandateEditorDialog from './MandateEditorDialog'

import {
  getAgentRelationships,
  recordOfflineAgent,
  inviteAgentRelationship,
  approveAgentRelationship,
  suspendAgentRelationship,
  endAgentRelationship,
  getMandatesForRelationship,
  proposeMandate,
  activateMandate,
  revokeMandate,
  searchClaimedAgents,
  acceptLandlordReferral
} from '@/lib/api/agent-network'
import type { ClaimedAgentMatch } from '@/lib/api/agent-network'
import type { AgentRelationshipType, AgentMandateType } from '@/types/members/agentNetworkTypes'

const columnHelper = createColumnHelper<AgentRelationshipType>()

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value)

  addMeta({ itemRank })

  return itemRank.passed
}

const statusColor: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  UNCLAIMED: 'default',
  INVITED: 'info',
  PENDING_APPROVAL: 'warning',
  ACTIVE: 'success',
  SUSPENDED: 'error',
  ENDED: 'default',
  DECLINED: 'default'
}

const statusLabel: Record<string, string> = {
  UNCLAIMED: 'Unclaimed',
  INVITED: 'Invitation sent',
  PENDING_APPROVAL: 'Approval needed',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  ENDED: 'Ended',
  DECLINED: 'Declined'
}

const FILTERS = ['ALL', 'UNCLAIMED', 'INVITED', 'PENDING_APPROVAL', 'ACTIVE', 'SUSPENDED', 'ENDED'] as const

const RelationshipsView = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const [rows, setRows] = useState<AgentRelationshipType[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL')
  const [snackbar, setSnackbar] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Record-offline dialog
  const [recordOpen, setRecordOpen] = useState(false)
  const [recordName, setRecordName] = useState('')
  const [recordEmail, setRecordEmail] = useState('')
  const [recordPhone, setRecordPhone] = useState('')
  const [saving, setSaving] = useState(false)

  // Invite dialog
  const [inviteFor, setInviteFor] = useState<AgentRelationshipType | null>(null)
  const [inviteChannel, setInviteChannel] = useState('EMAIL')
  const [inviteContact, setInviteContact] = useState('')
  const [issuedClaimCode, setIssuedClaimCode] = useState<string | null>(null)

  // Accept-referral dialog
  const [acceptOpen, setAcceptOpen] = useState(false)
  const [acceptCode, setAcceptCode] = useState('')

  // Invite / search dialog
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchContact, setSearchContact] = useState('')
  const [searchResults, setSearchResults] = useState<ClaimedAgentMatch[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)

  // Detail dialog
  const [detail, setDetail] = useState<AgentRelationshipType | null>(null)
  const [detailTab, setDetailTab] = useState(0)
  const [mandates, setMandates] = useState<AgentMandateType[]>([])
  const [mandatesLoading, setMandatesLoading] = useState(false)

  // Mandate editor
  const [mandateEditorOpen, setMandateEditorOpen] = useState(false)
  const [editingMandateId, setEditingMandateId] = useState<string | null>(null)

  // Confirm dialog (suspend / end / revoke with reason)
  const [confirm, setConfirm] = useState<{ kind: 'suspend' | 'end' | 'revoke'; id: string } | null>(null)
  const [confirmReason, setConfirmReason] = useState('')

  const fetchRows = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getAgentRelationships()

      setRows(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e?.message ?? 'Could not load agent relationships')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  const fetchMandates = useCallback(async (relationshipId: string) => {
    setMandatesLoading(true)

    try {
      const data = await getMandatesForRelationship(relationshipId)

      setMandates(Array.isArray(data) ? data : [])
    } catch {
      setMandates([])
    } finally {
      setMandatesLoading(false)
    }
  }, [])

  const openDetail = (row: AgentRelationshipType) => {
    setDetail(row)
    setDetailTab(0)
    fetchMandates(row.relationshipId)
  }

  const handleRecord = async () => {
    if (!recordName.trim()) {
      setSnackbar('Enter a display name for the offline agent')
      
return
    }

    setSaving(true)

    try {
      await recordOfflineAgent({ displayName: recordName.trim(), email: recordEmail || undefined, phone: recordPhone || undefined })
      setRecordOpen(false)
      setRecordName('')
      setRecordEmail('')
      setRecordPhone('')
      setSnackbar('Offline agent recorded')
      fetchRows()
    } catch (e: any) {
      setSnackbar(e?.message ?? 'Could not record agent')
    } finally {
      setSaving(false)
    }
  }

  const handleAcceptReferral = async () => {
    if (!acceptCode.trim()) {
      setSnackbar('Enter the invitation code from the referral message')

      return
    }

    setSaving(true)

    try {
      await acceptLandlordReferral(acceptCode.trim())

      setAcceptOpen(false)
      setAcceptCode('')
      setSnackbar('Referral accepted. Approve the pending relationship to grant any access.')
      fetchRows()
    } catch (e: any) {
      setSnackbar(e?.message ?? 'Could not accept referral')
    } finally {
      setSaving(false)
    }
  }

  const handleSearch = async () => {
    if (!searchContact.trim()) {
      setSnackbar('Enter the exact verified email or phone to search')
      
return
    }

    setSearching(true)
    setSearched(false)

    try {
      const results = await searchClaimedAgents(searchContact.trim())

      setSearchResults(Array.isArray(results) ? results : [])
      setSearched(true)
    } catch (e: any) {
      setSnackbar(e?.message ?? 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteFor) return
    setSaving(true)

    try {
      const issued = await inviteAgentRelationship(inviteFor.relationshipId, {
        contactChannel: inviteChannel,
        contact: inviteContact || undefined
      })


      // The claim code is shown exactly once — forward it to the agent
      // out-of-band. Earlier active invitations for this record were revoked.
      setIssuedClaimCode(issued.claimCode)
      setInviteContact('')
      fetchRows()
    } catch (e: any) {
      setSnackbar(e?.message ?? 'Could not send invitation')
    } finally {
      setSaving(false)
    }
  }

  const handleApprove = async (row: AgentRelationshipType) => {
    try {
      await approveAgentRelationship(row.relationshipId)
      setSnackbar('Relationship approved. Workspace access is now active.')
      fetchRows()
      setDetail(prev => (prev ? { ...prev, status: 'ACTIVE' } : prev))
    } catch (e: any) {
      setSnackbar(e?.message ?? 'Could not approve relationship')
    }
  }

  const handleConfirmAction = async () => {
    if (!confirm) return

    if (!confirmReason.trim() && confirm.kind !== 'revoke') {
      setSnackbar('Enter a reason — it is kept in the audit history')
      
return
    }

    try {
      if (confirm.kind === 'suspend' && detail) {
        await suspendAgentRelationship(detail.relationshipId, confirmReason.trim() || undefined)
        setSnackbar('Access suspended immediately. History is retained.')
        setDetail({ ...detail, status: 'SUSPENDED' })
      } else if (confirm.kind === 'end' && detail) {
        await endAgentRelationship(detail.relationshipId, confirmReason.trim() || undefined)
        setSnackbar('Relationship ended. History is retained.')
        setDetail({ ...detail, status: 'ENDED' })
      } else if (confirm.kind === 'revoke') {
        await revokeMandate(confirm.id)
        setSnackbar('Mandate revoked. It denies the very next request.')
        if (detail) fetchMandates(detail.relationshipId)
      }

      setConfirm(null)
      setConfirmReason('')
      fetchRows()
    } catch (e: any) {
      setSnackbar(e?.message ?? 'Action failed')
    }
  }

  const handleMandateAction = async (mandateId: string, action: 'propose' | 'activate') => {
    try {
      if (action === 'propose') await proposeMandate(mandateId)
      if (action === 'activate') await activateMandate(mandateId)
      setSnackbar(action === 'propose' ? 'Mandate terms sent to the agent' : 'Mandate activated')
      if (detail) fetchMandates(detail.relationshipId)
    } catch (e: any) {
      setSnackbar(e?.message ?? 'Mandate action failed')
    }
  }

  const filtered = filter === 'ALL' ? rows : rows.filter(r => r.status === filter)

  const columns = [
    columnHelper.accessor('displayName', {
      header: 'Agent',
      cell: info => (
        <Box>
          <Typography variant='body2' sx={{ fontWeight: 600 }}>{info.getValue() || '—'}</Typography>
          <Typography variant='caption' color='text.secondary'>
            {info.row.original.claimed ? 'Claimed profile' : 'Unclaimed record'}
          </Typography>
        </Box>
      )
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => (
        <Chip
          size='small'
          color={statusColor[info.getValue()] ?? 'default'}
          label={statusLabel[info.getValue()] ?? info.getValue()}
        />
      )
    }),
    columnHelper.accessor('source', {
      header: 'Source',
      cell: info => <Typography variant='body2'>{info.getValue() || '—'}</Typography>
    })
  ]

  const [globalFilter, setGlobalFilter] = useState('')

  const table = useReactTable({
    data: filtered,
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { globalFilter },
    globalFilterFn: fuzzyFilter,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  })

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Button variant='contained' onClick={() => setSearchOpen(true)}>
          Invite / search agent
        </Button>
        <Button variant='outlined' onClick={() => setRecordOpen(true)}>
          Record offline agent
        </Button>
        <Button variant='text' onClick={() => setAcceptOpen(true)}>
          Accept referral
        </Button>
        <Typography variant='caption' color='text.secondary' sx={{ alignSelf: 'center' }}>
          Search finds claimed profiles by exact verified contact only — or record an offline agent first, then invite.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2, alignItems: 'center' }}>
        <TextField
          size='small'
          placeholder='Search records…'
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
        />
        {FILTERS.map(f => (
          <Chip
            key={f}
            size='small'
            clickable
            color={filter === f ? 'primary' : 'default'}
            label={f === 'ALL' ? 'All' : (statusLabel[f] ?? f)}
            onClick={() => setFilter(f)}
          />
        ))}
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardHeader title='Agent relationships' subheader='Access is granted only by an approved mandate — never by signup or invitation alone' />
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : filtered.length === 0 ? (
            <Typography color='text.secondary'>No agent relationships yet. Record an offline agent to get started.</Typography>
          ) : isMobile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {table.getRowModel().rows.map(row => (
                <Card key={row.id} variant='outlined'>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography sx={{ fontWeight: 600 }}>{row.original.displayName || '—'}</Typography>
                      <Chip size='small' color={statusColor[row.original.status] ?? 'default'} label={statusLabel[row.original.status] ?? row.original.status} />
                    </Box>
                    <Button size='small' onClick={() => openDetail(row.original)}>Open</Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => (
                      <th key={h.id} style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                    <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Actions</th>
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} style={{ padding: '8px', borderBottom: '1px solid #f1f2f4' }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    <td style={{ padding: '8px', borderBottom: '1px solid #f1f2f4', textAlign: 'right' }}>
                      <Button size='small' onClick={() => openDetail(row.original)}>Open</Button>
                      {(row.original.status === 'UNCLAIMED' || row.original.status === 'INVITED') && (
                        <Button
                          size='small'
                          onClick={() => {
                            setIssuedClaimCode(null)
                            setInviteFor(row.original)
                            setInviteContact('')
                          }}
                        >
                          Invite
                        </Button>
                      )}
                      {row.original.status === 'PENDING_APPROVAL' && (
                        <Button size='small' color='success' onClick={() => handleApprove(row.original)}>
                          Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <TablePagination
            component='div'
            count={filtered.length}
            page={table.getState().pagination.pageIndex}
            onPageChange={(_, p) => table.setPageIndex(p)}
            rowsPerPage={table.getState().pagination.pageSize}
            onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
          />
        </CardContent>
      </Card>

      {/* Invite / search agent */}
      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Invite / search agent</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            Enter the agent&apos;s exact verified email or phone. Only claimed profiles already
            known to this workspace can match — there is no broad people search.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label='Verified email or phone'
              value={searchContact}
              onChange={e => {
                setSearchContact(e.target.value)
                setSearched(false)
              }}
              fullWidth
            />
            <Button variant='contained' onClick={handleSearch} disabled={searching}>
              {searching ? 'Searching…' : 'Search'}
            </Button>
          </Box>
          {searched && searchResults.length === 0 && (
            <Typography color='text.secondary'>
              No claimed profile matches. Record the agent as an offline contact, then invite them to claim it.
            </Typography>
          )}
          {searchResults.map(m => (
            <Card key={m.relationshipId} variant='outlined'>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>{m.displayName || '—'}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {m.status} · {m.contactMasked}
                  </Typography>
                </Box>
                <Button
                  size='small'
                  variant='outlined'
                  onClick={() => {
                    setSearchOpen(false)
                    setIssuedClaimCode(null)
                    setInviteFor({
                      relationshipId: m.relationshipId,
                      displayName: m.displayName,
                      status: m.status as AgentRelationshipType['status'],
                      source: 'LANDLORD_CREATED',
                      claimed: true
                    })
                    setInviteContact('')
                  }}
                >
                  Invite
                </Button>
              </CardContent>
            </Card>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSearchOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Accept referral */}
      <Dialog open={acceptOpen} onClose={() => setAcceptOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Accept a referral</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            Enter the code from the agent&apos;s invitation message. Accepting creates a pending
            relationship — the agent gets no access until you approve a mandate. The code only
            works for the contact it was sent to.
          </Typography>
          <TextField
            label='Invitation code'
            value={acceptCode}
            onChange={e => setAcceptCode(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAcceptOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleAcceptReferral} disabled={saving}>
            {saving ? 'Accepting…' : 'Accept referral'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record offline agent */}
      <Dialog open={recordOpen} onClose={() => setRecordOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Record offline agent</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            Creates an unclaimed workspace record. It grants no access until the agent claims it and you approve a mandate.
          </Typography>
          <TextField label='Display name' value={recordName} onChange={e => setRecordName(e.target.value)} fullWidth required />
          <TextField label='Email (optional)' value={recordEmail} onChange={e => setRecordEmail(e.target.value)} fullWidth />
          <TextField label='Phone (optional)' value={recordPhone} onChange={e => setRecordPhone(e.target.value)} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRecordOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleRecord} disabled={saving}>
            {saving ? 'Saving…' : 'Record agent'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite */}
      <Dialog
        open={!!inviteFor}
        onClose={() => {
          setInviteFor(null)
          setIssuedClaimCode(null)
        }}
        fullWidth
        maxWidth='sm'
      >
        <DialogTitle>Invite agent to claim record</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            Issues a single-use code expiring in 72 hours. Commission history stays attached to
            this record after the claim.
          </Typography>
          <TextField
            label='Contact channel'
            value={inviteChannel}
            onChange={e => setInviteChannel(e.target.value)}
            fullWidth
            helperText='EMAIL or SMS'
          />
          <TextField
            label='Contact (defaults to the record email/phone)'
            value={inviteContact}
            onChange={e => setInviteContact(e.target.value)}
            fullWidth
          />
          {issuedClaimCode && (
            <Alert severity='warning'>
              Forward this code to the agent now — it is shown exactly once and never again:
              <Typography component='div' sx={{ fontFamily: 'monospace', fontWeight: 700, mt: 1, wordBreak: 'break-all' }}>
                {issuedClaimCode}
              </Typography>
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setInviteFor(null)
              setIssuedClaimCode(null)
            }}
          >
            {issuedClaimCode ? 'Done' : 'Cancel'}
          </Button>
          {!issuedClaimCode && (
            <Button variant='contained' onClick={handleInvite} disabled={saving}>
              {saving ? 'Sending…' : 'Send invitation'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Detail with tabs */}
      <Dialog open={!!detail} onClose={() => setDetail(null)} fullWidth maxWidth='md'>
        <DialogTitle>{detail?.displayName || 'Agent record'}</DialogTitle>
        <DialogContent>
          {detail && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
              <Chip size='small' color={statusColor[detail.status] ?? 'default'} label={statusLabel[detail.status] ?? detail.status} />
              <Typography variant='caption' color='text.secondary'>
                {detail.claimed ? 'Claimed profile linked' : 'Unclaimed — snapshot contact only'}
              </Typography>
            </Box>
          )}
          <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)}>
            <Tab label='Profile' />
            <Tab label='Mandates' />
          </Tabs>
          <Divider sx={{ mb: 2 }} />
          {detailTab === 0 && detail && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(detail.status === 'UNCLAIMED' || detail.status === 'INVITED') && (
                <Button
                  variant='outlined'
                  onClick={() => {
                    setIssuedClaimCode(null)
                    setInviteFor(detail)
                    setInviteContact('')
                  }}
                >
                  Invite / search agent
                </Button>
              )}
              {detail.status === 'PENDING_APPROVAL' && (
                <Button variant='contained' color='success' onClick={() => handleApprove(detail)}>
                  Approve
                </Button>
              )}
              {(detail.status === 'ACTIVE' || detail.status === 'SUSPENDED') && (
                <>
                  <Button
                    variant='outlined'
                    color='warning'
                    onClick={() => {
                      setConfirmReason('')
                      setConfirm({ kind: 'suspend', id: detail.relationshipId })
                    }}
                  >
                    Suspend access
                  </Button>
                  <Button
                    variant='outlined'
                    color='error'
                    onClick={() => {
                      setConfirmReason('')
                      setConfirm({ kind: 'end', id: detail.relationshipId })
                    }}
                  >
                    End relationship
                  </Button>
                </>
              )}
              <Typography variant='caption' color='text.secondary' sx={{ width: '100%' }}>
                Suspending or ending removes access on the next request. History and commissions are retained.
              </Typography>
            </Box>
          )}
          {detailTab === 1 && detail && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={() => {
                    setEditingMandateId(null)
                    setMandateEditorOpen(true)
                  }}
                >
                  New mandate draft
                </Button>
              </Box>
              {mandatesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : mandates.length === 0 ? (
                <Typography color='text.secondary'>No mandates yet. Draft one to scope properties, capabilities and fee terms.</Typography>
              ) : (
                mandates.map(m => (
                  <Card key={m.mandateId} variant='outlined' sx={{ mb: 1.5 }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Box>
                        <Chip size='small' label={m.status} color={m.status === 'ACTIVE' ? 'success' : 'default'} />
                        <Typography variant='caption' color='text.secondary' sx={{ ml: 1 }}>
                          Terms v{m.termsVersion}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {(m.status === 'DRAFT' || m.status === 'PROPOSED') && (
                          <Button
                            size='small'
                            onClick={() => {
                              setEditingMandateId(m.mandateId)
                              setMandateEditorOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                        )}
                        {m.status === 'DRAFT' && (
                          <Button size='small' onClick={() => handleMandateAction(m.mandateId, 'propose')}>
                            Propose
                          </Button>
                        )}
                        {m.status === 'PENDING_AGENT_ACCEPTANCE' && (
                          <Button size='small' onClick={() => handleMandateAction(m.mandateId, 'activate')}>
                            Activate
                          </Button>
                        )}
                        {(m.status === 'ACTIVE' || m.status === 'SUSPENDED') && (
                          <Button
                            size='small'
                            color='error'
                            onClick={() => {
                              setConfirmReason('')
                              setConfirm({ kind: 'revoke', id: m.mandateId })
                            }}
                          >
                            Revoke
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetail(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {detail && (
        <MandateEditorDialog
          open={mandateEditorOpen}
          relationshipId={detail.relationshipId}
          mandateId={editingMandateId}
          onClose={() => setMandateEditorOpen(false)}
          onSaved={() => {
            setMandateEditorOpen(false)
            fetchMandates(detail.relationshipId)
            setSnackbar('Mandate draft saved')
          }}
        />
      )}

      {/* Confirm with reason */}
      <Dialog open={!!confirm} onClose={() => setConfirm(null)} fullWidth maxWidth='sm'>
        <DialogTitle>
          {confirm?.kind === 'suspend' && 'Suspend access?'}
          {confirm?.kind === 'end' && 'End relationship?'}
          {confirm?.kind === 'revoke' && 'Revoke mandate?'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            {confirm?.kind === 'revoke'
              ? 'Revocation takes effect on the very next request and cannot be undone. The mandate history stays.'
              : 'Access ends immediately for new requests. Records, commissions and audit history are kept.'}
          </Typography>
          <TextField
            label='Reason (kept in audit history)'
            value={confirmReason}
            onChange={e => setConfirmReason(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button variant='contained' color='error' onClick={handleConfirmAction}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={5000}
        onClose={() => setSnackbar(null)}
        message={snackbar ?? ''}
      />
    </Box>
  )
}

export default RelationshipsView
