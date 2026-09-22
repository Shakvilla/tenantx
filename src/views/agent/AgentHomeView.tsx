'use client'

import { useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
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
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { useAuth } from '@/contexts/AuthContext'

import {
  getAgentProfileMe,
  createAgentProfileMe,
  updateAgentProfileMe,
  getAgentWorkspaces,
  getAgentReferrals,
  createAgentReferral,
  withdrawAgentReferral,
  acceptAgentClaim,
  getPendingAgentMandates,
  acceptMandateAsAgent,
  type AgentProfileMe,
  type AgentWorkspace,
  type PendingAgentMandate
} from '@/lib/api/agent-network'

const AgentHomeView = ({ defaultTab = 0 }: { defaultTab?: number }) => {
  const { selectWorkspace } = useAuth()

  const [tab, setTab] = useState(defaultTab)
  const [profile, setProfile] = useState<AgentProfileMe | null>(null)
  const [workspaces, setWorkspaces] = useState<AgentWorkspace[]>([])
  const [referrals, setReferrals] = useState<{ referralId: string; landlordName: string; status: string; createdAt: string }[]>([])
  const [pendingMandates, setPendingMandates] = useState<PendingAgentMandate[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [profileMissing, setProfileMissing] = useState(false)
  const [setupName, setSetupName] = useState('')
  const [settingUp, setSettingUp] = useState(false)
  const [snackbar, setSnackbar] = useState<string | null>(null)

  // Profile edit
  const [bio, setBio] = useState('')
  const [editingProfile, setEditingProfile] = useState(false)

  // Referral dialog
  const [referOpen, setReferOpen] = useState(false)
  const [referName, setReferName] = useState('')
  const [referContact, setReferContact] = useState('')
  const [referConsent, setReferConsent] = useState(false)
  const [referNote, setReferNote] = useState('')

  // Claim dialog
  const [claimOpen, setClaimOpen] = useState(false)
  const [claimToken, setClaimToken] = useState('')

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    setProfileMissing(false)

    try {
      const [p, w, r, m] = await Promise.all([
        getAgentProfileMe(),
        getAgentWorkspaces(),
        getAgentReferrals(),
        getPendingAgentMandates()
      ])

      setProfile(p)
      setBio(p.bio ?? '')
      setWorkspaces(Array.isArray(w) ? w : [])
      setReferrals(Array.isArray(r) ? r : [])
      setPendingMandates(Array.isArray(m) ? m : [])
    } catch (e: any) {
      if (typeof e?.message === 'string' && e.message.includes('Agent profile not found')) {
        setProfileMissing(true)
      } else {
        setLoadError(e?.message ?? 'Could not load agent workspace')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSetupProfile = async () => {
    if (!setupName.trim()) {
      setSnackbar('Enter your public professional name')

      return
    }

    setSettingUp(true)

    try {
      await createAgentProfileMe({ publicName: setupName.trim() })
      setSetupName('')
      setSnackbar('Profile created — welcome')
      load()
    } catch (e: any) {
      setSnackbar(e?.message ?? 'Could not create profile')
    } finally {
      setSettingUp(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSaveProfile = async () => {
    setEditingProfile(true)

    try {
      const updated = await updateAgentProfileMe({ bio })

      setProfile(updated)
      setSnackbar('Profile updated')
    } catch (e: any) {
      setSnackbar(e?.message ?? 'Could not update profile')
    } finally {
      setEditingProfile(false)
    }
  }

  const handleRefer = async () => {
    if (!referName.trim() || !referContact.trim()) {
      setSnackbar('Enter the landlord name and a contact')
      
return
    }

    if (!referConsent) {
      setSnackbar('Confirm you have consent to share this contact')
      
return
    }

    try {
      await createAgentReferral({ landlordName: referName.trim(), contact: referContact.trim(), consentAttestation: true, privateNote: referNote || undefined })
      setReferOpen(false)
      setReferName('')
      setReferContact('')
      setReferConsent(false)
      setReferNote('')
      setSnackbar('Referral sent. You will see only its status — never account details.')
      load()
    } catch (e: any) {
      setSnackbar(e?.message ?? 'Could not send referral')
    }
  }

  const handleClaim = async () => {
    if (!claimToken.trim()) {
      setSnackbar('Enter the invitation code')

      return
    }

    try {
      await acceptAgentClaim(claimToken.trim())
      setClaimOpen(false)
      setClaimToken('')
      setSnackbar('Record claimed. It now appears under your workspaces once approved.')
      load()
    } catch (e: any) {
      setSnackbar(e?.message ?? 'Claim failed — check the code')
    }
  }

  const handleAcceptMandate = async (mandateId: string) => {
    try {
      await acceptMandateAsAgent(mandateId)
      setSnackbar('Commercial terms accepted. The landlord activates the mandate next.')
      load()
    } catch (e: any) {
      setSnackbar(e?.message ?? 'Could not accept mandate')
    }
  }

  const handleOpenWorkspace = async (tenantId: string, tenantName?: string) => {
    const res = await selectWorkspace({ tenantId, tenantName: tenantName ?? tenantId, role: 'AGENT', userType: 'AGENT' })

    setSnackbar(res.success ? 'Workspace selected' : (res.error ?? 'Could not select workspace'))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  const hasWork = workspaces.length > 0 || referrals.length > 0

  return (
    <Box>
      {loadError && (
        <Alert
          severity='error'
          sx={{ mb: 2 }}
          action={
            <Button color='inherit' size='small' onClick={load}>
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}

      {profileMissing && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant='h6'>Finish setting up your agent account</Typography>
            <Typography variant='body2' color='text.secondary'>
              Your sign-in works, but no agent profile exists yet — likely the
              signup completed before your profile was created. Enter your
              public professional name to finish.
            </Typography>
            <TextField
              label='Public professional name'
              value={setupName}
              onChange={e => setSetupName(e.target.value)}
              fullWidth
            />
            <Box>
              <Button variant='contained' onClick={handleSetupProfile} disabled={settingUp}>
                {settingUp ? 'Creating…' : 'Create profile'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {profile?.platformStatus === 'SUSPENDED' && (
        <Alert severity='warning' sx={{ mb: 2 }}>
          Your agent access is suspended. Existing records are kept, but workspace actions are
          unavailable until support reinstates your profile.
        </Alert>
      )}

      {profile && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant='h6'>{profile.publicName}</Typography>
            <Chip size='small' label='Account claimed' color='success' />
            <Chip
              size='small'
              label={profile.identityStatus === 'VERIFIED' ? 'Identity verified' : 'Identity unverified'}
              color={profile.identityStatus === 'VERIFIED' ? 'success' : 'default'}
            />
            <Chip
              size='small'
              label={
                profile.credentialStatus === 'VERIFIED'
                  ? 'Credential reviewed'
                  : profile.credentialStatus === 'SELF_REPORTED' || profile.credentialStatus === 'PENDING_REVIEW'
                    ? 'Credential under review — not verified'
                    : 'No credential supplied'
              }
              color={profile.credentialStatus === 'VERIFIED' ? 'success' : 'default'}
            />
          </CardContent>
        </Card>
      )}

      {!hasWork && pendingMandates.length === 0 && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography color='text.secondary'>
              Nothing here yet. Refer a landlord to start a relationship, or claim a record a landlord created for you.
            </Typography>
            <Button variant='contained' size='small' onClick={() => setReferOpen(true)}>
              Refer landlord
            </Button>
            <Button variant='outlined' size='small' onClick={() => setClaimOpen(true)}>
              Enter invitation code
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label='Workspaces' />
        <Tab label={`Action needed${pendingMandates.length ? ` (${pendingMandates.length})` : ''}`} />
        <Tab label='Referrals' />
        <Tab label='Profile' />
      </Tabs>
      <Divider sx={{ mb: 2 }} />

      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant='outlined' size='small' onClick={() => setClaimOpen(true)}>
              Enter invitation code
            </Button>
          </Box>
          {workspaces.length === 0 && <Typography color='text.secondary'>No landlord workspaces yet.</Typography>}
          {workspaces.map(w => (
            <Card key={w.tenantId} variant='outlined'>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>{w.tenantName || w.tenantId}</Typography>
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                    {w.tenantName ? w.tenantId : 'Landlord workspace'}
                  </Typography>
                  <Chip size='small' label={w.relationshipStatus} sx={{ mt: 0.5 }} />
                </Box>
                <Button size='small' variant='outlined' onClick={() => handleOpenWorkspace(w.tenantId, w.tenantName)}>
                  Use this workspace
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {pendingMandates.length === 0 && <Typography color='text.secondary'>Nothing needs your acceptance.</Typography>}
          {pendingMandates.map(m => (
            <Card key={m.mandateId} variant='outlined'>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>Mandate terms v{m.termsVersion}</Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {m.status} · workspace {m.tenantId}
                  </Typography>
                </Box>
                <Button size='small' variant='contained' onClick={() => handleAcceptMandate(m.mandateId)}>
                  Accept commercial terms
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {tab === 2 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
            <Button variant='contained' size='small' onClick={() => setReferOpen(true)}>
              Refer landlord
            </Button>
          </Box>
          {referrals.length === 0 && <Typography color='text.secondary'>No referrals yet.</Typography>}
          {referrals.map(r => (
            <Card key={r.referralId} variant='outlined' sx={{ mb: 1.5 }}>
              <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>{r.landlordName}</Typography>
                  <Chip size='small' label={r.status} sx={{ mt: 0.5 }} />
                </Box>
                {(r.status === 'SENT' || r.status === 'OPENED') && (
                  <Button
                    size='small'
                    onClick={async () => {
                      try {
                        await withdrawAgentReferral(r.referralId)
                        setSnackbar('Referral withdrawn')
                        load()
                      } catch (e: any) {
                        setSnackbar(e?.message ?? 'Could not withdraw referral')
                      }
                    }}
                  >
                    Withdraw
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {tab === 3 && profile && (
        <Card variant='outlined'>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity='info'>
              Identity verification and credential review are separate. A claimed account is not a verified identity,
              and a supplied credential is not a reviewed one.
            </Alert>
            <TextField label='Public name' value={profile.publicName} fullWidth disabled />
            <TextField label='Bio' value={bio} onChange={e => setBio(e.target.value)} fullWidth multiline rows={3} />
            <Box>
              <Button variant='contained' onClick={handleSaveProfile} disabled={editingProfile}>
                {editingProfile ? 'Saving…' : 'Save profile'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Claim dialog */}
      <Dialog open={claimOpen} onClose={() => setClaimOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Claim a landlord record</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            Paste the single-use invitation code the landlord sent you. It is checked
            against your own verified contact automatically — codes expire, and
            mismatches are rejected and logged.
          </Typography>
          <TextField label='Invitation code' value={claimToken} onChange={e => setClaimToken(e.target.value)} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClaimOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleClaim}>
            Claim record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Refer dialog */}
      <Dialog open={referOpen} onClose={() => setReferOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Refer a landlord</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            The landlord gets a time-limited invitation naming you. Accepting creates a pending
            relationship — never property access. You will see only the referral status.
          </Typography>
          <TextField label='Landlord name' value={referName} onChange={e => setReferName(e.target.value)} fullWidth required />
          <TextField label='Landlord contact (email or phone)' value={referContact} onChange={e => setReferContact(e.target.value)} fullWidth required />
          <TextField label='Private note (optional, never shared)' value={referNote} onChange={e => setReferNote(e.target.value)} fullWidth multiline rows={2} />
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: '0.875rem' }}>
            <input type='checkbox' checked={referConsent} onChange={e => setReferConsent(e.target.checked)} style={{ marginTop: 4 }} />
            I confirm the landlord consented to be contacted about TenantX.
          </label>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReferOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={handleRefer}>
            Send referral
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snackbar} autoHideDuration={5000} onClose={() => setSnackbar(null)} message={snackbar ?? ''} />
    </Box>
  )
}

export default AgentHomeView
