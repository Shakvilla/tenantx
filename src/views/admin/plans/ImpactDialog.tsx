'use client'

// MUI Imports
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'

// Type Imports
import type { PlanImpact } from '@/lib/api/subscription-plans-admin'

/**
 * The consent step for a change the server has described.
 *
 * Two rules hold this together, and both are easy to "improve" into a bug:
 *
 * 1. **The warnings are rendered verbatim.** The impact hash the admin is about to replay is
 *    computed over these exact strings. Rewriting them into friendlier copy would mean the admin
 *    reads one thing and confirms another — which is precisely the failure the handshake exists
 *    to prevent, reintroduced at the last step.
 *
 * 2. **A stale acknowledgement is not a retry.** A second 409 means the plan changed underneath —
 *    another admin edited it, or the subscriber count moved — so the hash no longer matches what
 *    the server would compute. Replaying it cannot succeed, so Confirm is withdrawn rather than
 *    offered again. A button guaranteed to fail is worse than no button.
 */

interface ImpactDialogProps {
  /** Null when there is nothing awaiting consent. */
  impact: PlanImpact | null

  /** True when a replayed acknowledgement was itself refused. */
  stale: boolean
  onConfirm: () => void
  onClose: () => void
}

const ImpactDialog = ({ impact, stale, onConfirm, onClose }: ImpactDialogProps) => {
  if (!impact) return null

  return (
    <Dialog open onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>{stale ? 'This plan changed while you were reading' : 'Confirm this change'}</DialogTitle>

      <DialogContent dividers>
        {stale ? (
          <Alert severity='warning' sx={{ mb: 2 }}>
            Someone else changed this plan, or its subscriber count moved, since you were shown the
            impact below. Your confirmation was refused because it described a situation that no
            longer holds. Reload to see the current impact.
          </Alert>
        ) : (
          <Typography variant='body2' sx={{ mb: 2 }}>
            This affects <strong>{impact.affectedSubscribers}</strong> active subscriber
            {impact.affectedSubscribers === 1 ? '' : 's'} at their next renewal.
          </Typography>
        )}

        <List dense disablePadding>
          {impact.warnings.map((warning, index) => (
            <ListItem key={index} disableGutters>
              {/* Verbatim, deliberately. See this file's header. */}
              <ListItemText primary={warning} primaryTypographyProps={{ variant: 'body2' }} />
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions>
        <Button color='secondary' onClick={onClose}>
          Cancel
        </Button>
        {stale ? (
          <Button variant='contained' onClick={() => window.location.reload()}>
            Reload
          </Button>
        ) : (
          <Button variant='contained' onClick={onConfirm}>
            Confirm and save
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ImpactDialog
