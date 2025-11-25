'use client'

// React Imports
import { useRef, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

const CreateButton = () => {
  // States
  const [open, setOpen] = useState(false)

  // Refs
  const anchorRef = useRef<HTMLButtonElement>(null)

  // Hooks
  const { settings } = useSettings()

  const handleClose = () => {
    setOpen(false)
  }

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  const createOptions = [
    { label: 'New Property', icon: 'ri-building-line', href: '/properties/add' },
    { label: 'New Tenant', icon: 'ri-user-add-line', href: '/tenants/add' },
    { label: 'New Invoice', icon: 'ri-file-add-line', href: '/billing/invoices/add' },
    { label: 'New Expense', icon: 'ri-money-dollar-circle-line', href: '/expenses/add' },
    { label: 'New Maintenance Request', icon: 'ri-tools-line', href: '/maintenance/requests/add' }
  ]

  return (
    <>
      <Button
        ref={anchorRef}
        variant='contained'
        color='primary'
        onClick={handleToggle}
        endIcon={<i className='ri-arrow-down-s-line' />}
        sx={{
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 500
        }}
      >
        Create
      </Button>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-start'
        anchorEl={anchorRef.current}
        className='min-is-[200px] !mbs-4 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom-start' ? 'left top' : 'right top' }}
          >
            <Paper className={settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList>
                  {createOptions.map((option, index) => (
                    <MenuItem
                      key={index}
                      className='gap-3 pli-4'
                      onClick={handleClose}
                      component='a'
                      href={option.href}
                    >
                      <i className={option.icon} />
                      <Typography color='text.primary'>{option.label}</Typography>
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default CreateButton

