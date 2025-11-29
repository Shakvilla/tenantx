'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'

type AcceptDocumentDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  onConfirm: () => void
}

const AcceptDocumentDialog = ({ open, setOpen, onConfirm }: AcceptDocumentDialogProps) => {
  const handleConfirm = () => {
    onConfirm()
    setOpen(false)
  }

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth='sm' fullWidth>
      <DialogContent className='flex flex-col items-center gap-4 pbs-8 pbe-6'>
        <Box className='flex flex-col items-center gap-4'>
          {/* Checkmark Icon */}
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'primary.light',
              border: '4px solid',
              borderColor: 'primary.main',
              '&::before': {
                content: '""',
                position: 'absolute',
                width: 100,
                height: 100,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: 'primary.light',
                opacity: 0.5
              }
            }}
          >
            <i className='ri-checkbox-circle-fill text-5xl text-primary' />
          </Avatar>

          {/* Main Question */}
          <Typography variant='h6' className='font-medium text-center'>
            Are you sure you want to accept this record?
          </Typography>

          {/* Warning Message */}
          <Typography variant='body2' color='text.secondary' className='text-center'>
            You won&#39;t be able to revert this!
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='warning' onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button variant='contained' color='primary' onClick={handleConfirm}>
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AcceptDocumentDialog

