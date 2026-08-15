'use client'

// React Imports
import { } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'

type AcceptDocumentDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onConfirm: () => void
  documentName?: string
}

const AcceptDocumentDialog = ({ open, setOpen, onConfirm, documentName }: AcceptDocumentDialogProps) => {
  // Handle Close
  const handleClose = () => setOpen(false)

  // Handle Confirm
  const handleConfirm = () => {
    onConfirm()
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent className='flex flex-col items-center gap-4 sm:pbs-16 sm:pbi-16 sm:pli-16'>
        <Avatar
          variant='rounded'
          sx={{ width: 100, height: 100, backgroundColor: 'var(--mui-palette-success-lightOpacity)' }}
        >
          <i className='ri-check-line text-[60px] text-success' />
        </Avatar>
        <div className='flex flex-col gap-2 text-center'>
          <Typography variant='h4'>Accept Document</Typography>
          <Typography>
            Are you sure you want to accept <strong>{documentName || 'this document'}</strong>? This action will mark
            the document as approved.
          </Typography>
        </div>
      </DialogContent>
      <DialogActions className='justify-center pbs-0 sm:pbe-16 sm:pli-16 gap-2'>
        <Button variant='contained' onClick={handleConfirm}>
          Yes, Accept it!
        </Button>
        <Button variant='outlined' color='secondary' onClick={handleClose}>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AcceptDocumentDialog
