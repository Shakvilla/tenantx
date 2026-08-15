'use client'

// React Imports
import { useState } from 'react'
import type { ReactNode, MouseEventHandler } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'

// Type Imports
import type { OptionType, OptionMenuItemType } from '@core/components/option-menu/types'

/**
 * RowActions — renders row actions as inline icon buttons when there are few,
 * and collapses into a "⋯" overflow menu when there are many, so no action is
 * ever pushed off the right edge of a horizontally-scrolling table.
 */

type Props = {
  options: OptionType[]

  // iconButtonProps is accepted but ignored — kept for API compatibility
  iconButtonProps?: object
}

const INLINE_LIMIT = 2

const isMenuItem = (option: OptionType): option is OptionMenuItemType =>
  typeof option !== 'string' && !('divider' in option)

const iconOf = (opt: OptionMenuItemType): ReactNode =>
  typeof opt.icon === 'string' ? <i className={`${opt.icon} text-lg`} /> : ((opt.icon as ReactNode) ?? null)

const isErrorOpt = (opt: OptionMenuItemType): boolean => {
  const sx = opt.menuItemProps?.sx as Record<string, any> | undefined

  return typeof sx?.color === 'string' && (sx.color.includes('error') || sx.color === 'red')
}

const RowActions = ({ options }: Props) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const items = options.filter(isMenuItem)

  const renderInline = (opt: OptionMenuItemType, key: number) => {
    const isError = isErrorOpt(opt)

    if (opt.href) {
      return (
        <Tooltip key={key} title={opt.text as string} placement='top'>
          {/* @ts-ignore — MUI polymorphic component */}
          <IconButton size='small' component={Link} href={opt.href as string} color={isError ? 'error' : 'default'}>
            {iconOf(opt)}
          </IconButton>
        </Tooltip>
      )
    }

    return (
      <Tooltip key={key} title={opt.text as string} placement='top'>
        <IconButton
          size='small'
          color={isError ? 'error' : 'default'}
          onClick={opt.menuItemProps?.onClick as unknown as MouseEventHandler<HTMLButtonElement>}
        >
          {iconOf(opt)}
        </IconButton>
      </Tooltip>
    )
  }

  if (items.length <= INLINE_LIMIT) {
    return <div className='flex items-center'>{items.map((opt, i) => renderInline(opt, i))}</div>
  }

  return (
    <div className='flex items-center'>
      <Tooltip title='More actions' placement='top'>
        <IconButton size='small' aria-label='more actions' onClick={e => setAnchorEl(e.currentTarget)}>
          <i className='ri-more-2-fill text-lg' />
        </IconButton>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {items.map((opt, i) => {
          const isError = isErrorOpt(opt)
          const commonSx = isError ? { color: 'error.main' } : undefined

          if (opt.href) {
            return (
              <MenuItem
                key={i}
                component={Link}
                href={opt.href as string}
                onClick={() => setAnchorEl(null)}
                sx={commonSx}
              >
                <ListItemIcon sx={commonSx}>{iconOf(opt)}</ListItemIcon>
                <ListItemText>{opt.text as string}</ListItemText>
              </MenuItem>
            )
          }

          return (
            <MenuItem
              key={i}
              sx={commonSx}
              onClick={e => {
                setAnchorEl(null)
                ;(opt.menuItemProps?.onClick as MouseEventHandler<HTMLElement> | undefined)?.(e)
              }}
            >
              <ListItemIcon sx={commonSx}>{iconOf(opt)}</ListItemIcon>
              <ListItemText>{opt.text as string}</ListItemText>
            </MenuItem>
          )
        })}
      </Menu>
    </div>
  )
}

export default RowActions
