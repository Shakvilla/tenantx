'use client'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

type DeleteDocumentDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onConfirm: () => void
  documentName?: string
}

/**
 * Single-step delete confirmation for a document: the API call fires on the one
 * confirm click, and the caller reports the outcome inline.
 *
 * This was originally written to route around the shared ConfirmationDialog,
 * which used to show "deleted successfully" before the request was even sent and
 * only fired the delete once that screen was dismissed. That defect is fixed —
 * the shared dialog now awaits the action and reports what actually happened —
 * so this exists for its shorter flow, not to dodge a bug.
 */
const DeleteDocumentDialog = ({ open, setOpen, onConfirm, documentName }: DeleteDocumentDialogProps) => {
  const handleClose = () => setOpen(false)

  const handleConfirm = () => {
    onConfirm()
    handleClose()
  }

  return (
    <Dialog fullWidth maxWidth='xs' open={open} onClose={handleClose} closeAfterTransition={false}>
      <DialogContent className='flex items-center flex-col text-center sm:pbs-16 sm:pbe-6 sm:pli-16'>
        <i className='ri-error-warning-line text-[88px] mbe-6 text-warning' />
        <Typography variant='h4'>Delete this document?</Typography>
        <Typography color='text.primary' className='mbs-2'>
          {documentName ? <><strong>{documentName}</strong> </> : 'This document '}
          and its uploaded file will be permanently removed. You won&#39;t be able to undo this.
        </Typography>
      </DialogContent>
      <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16 gap-2'>
        <Button variant='contained' color='error' onClick={handleConfirm}>
          Yes, Delete Document
        </Button>
        <Button variant='outlined' color='secondary' onClick={handleClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteDocumentDialog
