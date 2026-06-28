'use client'

// React Imports
import { useRef, useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Tooltip from '@mui/material/Tooltip'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

const CreateButton = () => {
  // States
  const [open, setOpen] = useState(false)

  // Refs
  const anchorRef = useRef<HTMLButtonElement>(null)

  // Hooks
  const { settings } = useSettings()
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))

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
      {isMobile ? (
        <Tooltip title='Create'>
          <IconButton
            ref={anchorRef}
            onClick={handleToggle}
            color='primary'
            sx={{ border: 1, borderColor: 'primary.main', borderRadius: '8px', p: '6px' }}
            aria-label='Create'
          >
            <i className='ri-add-line text-xl' />
          </IconButton>
        </Tooltip>
      ) : (
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
      )}
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
