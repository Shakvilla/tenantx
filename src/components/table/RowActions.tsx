'use client'

// React Imports
import type { ReactNode, MouseEventHandler } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

// Type Imports
import type { OptionType, OptionMenuItemType } from '@core/components/option-menu/types'

/**
 * RowActions — drop-in replacement for OptionMenu that renders actions as
 * inline icon buttons with tooltips instead of a dropdown menu.
 *
 * Accepts the same `options` prop as OptionMenu so existing call-sites only
 * need an import swap + tag rename.
 */

type Props = {
  options: OptionType[]
  // iconButtonProps is accepted but ignored — kept for API compatibility
  iconButtonProps?: object
}

const RowActions = ({ options }: Props) => {
  return (
    <div className='flex items-center'>
      {options.map((option, index) => {
        // Skip plain strings and dividers
        if (typeof option === 'string' || 'divider' in option) return null

        const opt = option as OptionMenuItemType

        // Detect error/destructive actions by inspecting the sx color hint
        const sx = opt.menuItemProps?.sx as Record<string, any> | undefined
        const isError =
          typeof sx?.color === 'string' &&
          (sx.color.includes('error') || sx.color === 'red')

        const iconEl =
          typeof opt.icon === 'string' ? (
            <i className={`${opt.icon} text-lg`} />
          ) : (
            (opt.icon as ReactNode) ?? null
          )

        // href → render as Link-powered IconButton
        if (opt.href) {
          return (
            <Tooltip key={index} title={opt.text as string} placement='top'>
              {/* @ts-ignore — MUI polymorphic component */}
              <IconButton
                size='small'
                component={Link}
                href={opt.href as string}
                color={isError ? 'error' : 'default'}
              >
                {iconEl}
              </IconButton>
            </Tooltip>
          )
        }

        // onClick action
        return (
          <Tooltip key={index} title={opt.text as string} placement='top'>
            <IconButton
              size='small'
              color={isError ? 'error' : 'default'}
              onClick={opt.menuItemProps?.onClick as MouseEventHandler<HTMLButtonElement>}
            >
              {iconEl}
            </IconButton>
          </Tooltip>
        )
      })}
    </div>
  )
}

export default RowActions
