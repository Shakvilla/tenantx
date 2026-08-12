'use client'

// React Imports
import { Fragment, useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import classnames from 'classnames'

type ConfirmationType =
  | 'delete-account'
  | 'unsubscribe'
  | 'suspend-account'
  | 'delete-order'
  | 'delete-customer'
  | 'delete-property'
  | 'delete-unit'
  | 'delete-occupant'
  | 'delete-tenant'
  | 'delete-expense'
  | 'delete-document'
  | 'delete-communication'
  | 'delete-maintainer'
  | 'delete-maintenance-request'

type ConfirmationDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  type: ConfirmationType

  /**
   * The action itself. Awaited before any outcome is reported, so it may be
   * async — and if it throws, the result dialog reports the failure and shows
   * the thrown message rather than claiming the action succeeded.
   */
  onConfirm?: () => void | Promise<void>
}

const ConfirmationDialog = ({ open, setOpen, type, onConfirm }: ConfirmationDialogProps) => {
  // States
  const [secondDialog, setSecondDialog] = useState(false)
  const [userInput, setUserInput] = useState(false)
  const [busy, setBusy] = useState(false)

  /**
   * Why this exists.
   *
   * The result dialog used to open from handleConfirmation() and onConfirm()
   * ran later, from handleSecondDialogClose(). So "Deleted — Property deleted
   * successfully." rendered BEFORE the request was sent, and regardless of what
   * came back. A landlord whose delete the server refused was congratulated on
   * it, and the row was still there.
   *
   * Null while the action has not been attempted; the reason string is the
   * server's own message, which is the only text that says anything useful
   * ("Move out all active occupants before deleting this property").
   */
  const [failure, setFailure] = useState<string | null>(null)

  // Vars
  const Wrapper = type === 'suspend-account' ? 'div' : Fragment

  const handleSecondDialogClose = () => {
    setSecondDialog(false)
    setOpen(false)
    setFailure(null)
  }

  const handleConfirmation = async (value: boolean) => {
    setUserInput(value)

    if (!value) {
      setSecondDialog(true)
      setOpen(false)

      return
    }

    // Run the action FIRST, and report what actually happened.
    setBusy(true)
    setFailure(null)

    try {
      await onConfirm?.()
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
      setOpen(false)
      setSecondDialog(true)
    }
  }

  const succeeded = userInput && !failure

  return (
    <>
      <Dialog fullWidth maxWidth='xs' open={open} onClose={() => setOpen(false)} closeAfterTransition={false}>
        <DialogContent className='flex items-center flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          <i className='ri-error-warning-line text-[88px] mbe-6 text-warning' />
          <Wrapper
            {...(type === 'suspend-account' && {
              className: 'flex flex-col items-center gap-2'
            })}
          >
            <Typography variant='h4'>
              {type === 'delete-account' && 'Are you sure you want to deactivate your account?'}
              {type === 'unsubscribe' && 'Are you sure to cancel your subscription?'}
              {type === 'suspend-account' && 'Are you sure?'}
              {type === 'delete-order' && 'Are you sure?'}
              {type === 'delete-customer' && 'Are you sure?'}
              {type === 'delete-property' && 'Are you sure?'}
              {type === 'delete-unit' && 'Are you sure?'}
              {type === 'delete-occupant' && 'Are you sure?'}
              {type === 'delete-tenant' && 'Are you sure?'}
              {type === 'delete-expense' && 'Are you sure?'}
              {type === 'delete-document' && 'Are you sure?'}
              {type === 'delete-communication' && 'Are you sure?'}
              {type === 'delete-maintainer' && 'Are you sure?'}
              {type === 'delete-maintenance-request' && 'Are you sure?'}
            </Typography>
            {type === 'suspend-account' && (
              <Typography color='text.primary'>You won&#39;t be able to revert user!</Typography>
            )}
            {type === 'delete-order' && (
              <Typography color='text.primary'>You won&#39;t be able to revert order!</Typography>
            )}
            {type === 'delete-customer' && (
              <Typography color='text.primary'>You won&#39;t be able to revert customer!</Typography>
            )}
            {type === 'delete-property' && (
              <Typography color='text.primary'>You won&#39;t be able to revert property!</Typography>
            )}
            {type === 'delete-unit' && (
              <Typography color='text.primary'>You won&#39;t be able to revert unit!</Typography>
            )}
            {type === 'delete-occupant' && (
              <Typography color='text.primary'>You won&#39;t be able to revert occupant!</Typography>
            )}
            {type === 'delete-tenant' && (
              <Typography color='text.primary'>You won&#39;t be able to revert tenant!</Typography>
            )}
            {type === 'delete-expense' && (
              <Typography color='text.primary'>You won&#39;t be able to revert expense!</Typography>
            )}
            {type === 'delete-document' && (
              <Typography color='text.primary'>You won&#39;t be able to revert document!</Typography>
            )}
            {type === 'delete-communication' && (
              <Typography color='text.primary'>You won&#39;t be able to revert communication!</Typography>
            )}
            {type === 'delete-maintainer' && (
              <Typography color='text.primary'>You won&#39;t be able to revert maintainer!</Typography>
            )}
            {type === 'delete-maintenance-request' && (
              <Typography color='text.primary'>You won&#39;t be able to revert maintenance request!</Typography>
            )}
          </Wrapper>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button
            variant='contained'
            onClick={() => handleConfirmation(true)}
            // The action now runs while this dialog is still up, so it has to
            // say so — and a second click must not fire a second delete.
            disabled={busy}
            startIcon={busy ? <CircularProgress size={16} color='inherit' /> : undefined}
          >
            {type === 'suspend-account'
              ? 'Yes, Suspend User!'
              : type === 'delete-order'
                ? 'Yes, Delete Order!'
                : type === 'delete-customer'
                  ? 'Yes, Delete Customer!'
                  : type === 'delete-property'
                    ? 'Yes, Delete Property!'
                    : type === 'delete-unit'
                      ? 'Yes, Delete Unit!'
                      : type === 'delete-occupant'
                        ? 'Yes, Delete Occupant!'
                      : type === 'delete-tenant'
                        ? 'Yes, Delete Tenant!'
                      : type === 'delete-expense'
                        ? 'Yes, Delete Expense!'
                        : type === 'delete-document'
                          ? 'Yes, Delete Document!'
                          : type === 'delete-communication'
                            ? 'Yes, Delete Communication!'
                            : type === 'delete-maintainer'
                              ? 'Yes, Delete Maintainer!'
                              : type === 'delete-maintenance-request'
                                ? 'Yes, Delete Request!'
                                : 'Yes'}
          </Button>
          <Button
            variant='outlined'
            color='secondary'
            disabled={busy}
            onClick={() => {
              handleConfirmation(false)
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={secondDialog} onClose={handleSecondDialogClose} closeAfterTransition={false}>
        <DialogContent className='flex items-center flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
          <i
            className={classnames('text-[88px] mbe-6', {
              'ri-checkbox-circle-line': succeeded,
              'text-success': succeeded,
              'ri-close-circle-line': !succeeded,
              'text-error': !succeeded
            })}
          />
          <Typography variant='h4' className='mbe-2'>
            {failure
              ? 'Not done'
              : succeeded
                ? `${type === 'delete-account' ? 'Deactivated' : type === 'unsubscribe' ? 'Unsubscribed' : type === 'delete-order' || type === 'delete-customer' || type === 'delete-property' || type === 'delete-unit' || type === 'delete-occupant' || type === 'delete-tenant' || type === 'delete-expense' || type === 'delete-document' || type === 'delete-communication' || type === 'delete-maintainer' || type === 'delete-maintenance-request' ? 'Deleted' : 'Suspended!'}`
                : 'Cancelled'}
          </Typography>
          <Typography color='text.primary'>
            {/* The server's own words. They say what to do about it; ours would not. */}
            {failure ? (
              failure
            ) : succeeded ? (
              <>
                {type === 'delete-account' && 'Your account has been deactivated successfully.'}
                {type === 'unsubscribe' && 'Your subscription cancelled successfully.'}
                {type === 'suspend-account' && 'User has been suspended.'}
                {type === 'delete-order' && 'Your order deleted successfully.'}
                {type === 'delete-customer' && 'Your customer removed successfully.'}
                {type === 'delete-property' && 'Property deleted successfully.'}
                {type === 'delete-unit' && 'Unit deleted successfully.'}
                {type === 'delete-occupant' && 'Occupant deleted successfully.'}
                {type === 'delete-tenant' && 'Tenant deleted successfully.'}
                {type === 'delete-expense' && 'Expense deleted successfully.'}
                {type === 'delete-document' && 'Document deleted successfully.'}
                {type === 'delete-communication' && 'Communication deleted successfully.'}
                {type === 'delete-maintainer' && 'Maintainer deleted successfully.'}
                {type === 'delete-maintenance-request' && 'Maintenance request deleted successfully.'}
              </>
            ) : (
              <>
                {type === 'delete-account' && 'Account Deactivation Cancelled!'}
                {type === 'unsubscribe' && 'Unsubscription Cancelled!!'}
                {type === 'suspend-account' && 'Cancelled Suspension :)'}
                {type === 'delete-order' && 'Order Deletion Cancelled'}
                {type === 'delete-customer' && 'Customer Deletion Cancelled'}
                {type === 'delete-property' && 'Property Deletion Cancelled'}
                {type === 'delete-unit' && 'Unit Deletion Cancelled'}
                {type === 'delete-occupant' && 'Occupant Deletion Cancelled'}
                {type === 'delete-tenant' && 'Tenant Deletion Cancelled'}
                {type === 'delete-expense' && 'Expense Deletion Cancelled'}
                {type === 'delete-document' && 'Document Deletion Cancelled'}
                {type === 'delete-communication' && 'Communication Deletion Cancelled'}
                {type === 'delete-maintainer' && 'Maintainer Deletion Cancelled'}
                {type === 'delete-maintenance-request' && 'Maintenance Request Deletion Cancelled'}
              </>
            )}
          </Typography>
        </DialogContent>
        <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16'>
          <Button variant='contained' color='success' onClick={handleSecondDialogClose}>
            Ok
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default ConfirmationDialog

