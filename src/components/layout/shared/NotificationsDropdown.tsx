'use client'

// React Imports
import { useRef, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'

// MUI Imports
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Tooltip from '@mui/material/Tooltip'
import Divider from '@mui/material/Divider'
import Avatar from '@mui/material/Avatar'
import Skeleton from '@mui/material/Skeleton'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import Button from '@mui/material/Button'
import type { Theme } from '@mui/material/styles'

// Third Party Components
import classnames from 'classnames'
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { ThemeColor } from '@core/types'
import type { CustomAvatarProps } from '@core/components/mui/Avatar'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// API Imports
import {
  getInAppNotifications,
  getInAppUnreadCount,
  markInAppNotificationRead,
  markAllInAppNotificationsRead,
  type InAppNotification
} from '@/lib/api/notifications'

export type NotificationsType = {
  title: string
  subtitle: string
  time: string
  read: boolean
} & (
  | {
      avatarImage?: string
      avatarIcon?: never
      avatarText?: never
      avatarColor?: never
      avatarSkin?: never
    }
  | {
      avatarIcon?: string
      avatarColor?: ThemeColor
      avatarSkin?: CustomAvatarProps['skin']
      avatarImage?: never
      avatarText?: never
    }
  | {
      avatarText?: string
      avatarColor?: ThemeColor
      avatarSkin?: CustomAvatarProps['skin']
      avatarImage?: never
      avatarIcon?: never
    }
)

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function mapEntityToAvatar(entityType: string | null): Pick<NotificationsType, 'avatarIcon' | 'avatarColor'> {
  switch (entityType) {
    case 'MAINTENANCE_REQUEST':
      return { avatarIcon: 'ri-tools-line', avatarColor: 'warning' }
    case 'INVOICE':
    case 'PAYMENT':
      return { avatarIcon: 'ri-money-dollar-circle-line', avatarColor: 'success' }
    case 'AGREEMENT':
      return { avatarIcon: 'ri-file-text-line', avatarColor: 'primary' }
    default:
      return { avatarIcon: 'ri-notification-2-line', avatarColor: 'info' }
  }
}

function mapInAppToUI(n: InAppNotification): NotificationsType & { id: string } {
  return {
    id: n.id,
    title: n.title,
    subtitle: n.body ?? '',
    time: relativeTime(n.createdAt),
    read: n.read,
    ...mapEntityToAvatar(n.entityType)
  } as NotificationsType & { id: string }
}

// ── Scroll Wrapper ────────────────────────────────────────────────────────────

const ScrollWrapper = ({ children, hidden }: { children: ReactNode; hidden: boolean }) => {
  if (hidden) {
    return <div className='overflow-x-hidden bs-full'>{children}</div>
  } else {
    return (
      <PerfectScrollbar className='bs-full' options={{ wheelPropagation: false, suppressScrollX: true }}>
        {children}
      </PerfectScrollbar>
    )
  }
}

const getAvatar = (
  params: Pick<NotificationsType, 'avatarImage' | 'avatarIcon' | 'title' | 'avatarText' | 'avatarColor' | 'avatarSkin'>
) => {
  const { avatarImage, avatarIcon, avatarText, title, avatarColor, avatarSkin } = params

  if (avatarImage) {
    return <Avatar src={avatarImage} />
  } else if (avatarIcon) {
    return (
      <CustomAvatar color={avatarColor} skin={avatarSkin || 'light-static'}>
        <i className={avatarIcon} />
      </CustomAvatar>
    )
  } else {
    return (
      <CustomAvatar color={avatarColor} skin={avatarSkin || 'light-static'}>
        {avatarText || getInitials(title)}
      </CustomAvatar>
    )
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

const NotificationsDropdown = ({ notifications: _propNotifications }: { notifications?: NotificationsType[] }) => {
  // States
  const [open, setOpen] = useState(false)
  const [notificationsState, setNotificationsState] = useState<(NotificationsType & { id: string })[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Refs
  const anchorRef = useRef<HTMLButtonElement>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  // Hooks
  const hidden = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'))
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))
  const { settings } = useSettings()

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const page = await getInAppNotifications({ size: 10 })
      setNotificationsState(page.content.map(mapInAppToUI))
    } catch {
      // silently fail — badge will still show cached count
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getInAppUnreadCount()
      setUnreadCount(count)
    } catch {
      // ignore
    }
  }, [])

  // Fetch notifications list on mount
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Poll unread count every 60 seconds
  useEffect(() => {
    fetchUnreadCount()
    const timer = setInterval(fetchUnreadCount, 60_000)
    return () => clearInterval(timer)
  }, [fetchUnreadCount])

  const readAll = notificationsState.every(n => n.read)

  const handleClose = () => {
    setOpen(false)
  }

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
    // Refresh list when opening
    if (!open) fetchNotifications()
  }

  // Mark individual notification as read via API
  const handleReadNotification = async (id: string, index: number) => {
    const notification = notificationsState[index]
    if (notification.read) return
    try {
      await markInAppNotificationRead(id)
      setNotificationsState(prev => {
        const next = [...prev]
        next[index] = { ...next[index], read: true }
        return next
      })
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // ignore
    }
  }

  // Remove notification from local state (no API delete endpoint)
  const handleRemoveNotification = (index: number) => {
    setNotificationsState(prev => {
      const next = [...prev]
      const removed = next.splice(index, 1)
      if (!removed[0].read) {
        setUnreadCount(c => Math.max(0, c - 1))
      }
      return next
    })
  }

  // Mark all as read via API
  const readAllNotifications = async () => {
    try {
      await markAllInAppNotificationsRead()
      setNotificationsState(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const adjustPopoverHeight = () => {
      if (ref.current) {
        const availableHeight = window.innerHeight - 100
        ref.current.style.height = `${Math.min(availableHeight, 550)}px`
      }
    }

    window.addEventListener('resize', adjustPopoverHeight)
    return () => window.removeEventListener('resize', adjustPopoverHeight)
  }, [])

  return (
    <>
      <IconButton ref={anchorRef} onClick={handleToggle} className='text-textPrimary'>
        <Badge
          color='error'
          className='cursor-pointer'
          variant='dot'
          overlap='circular'
          invisible={unreadCount === 0}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <i className='ri-notification-2-line' />
        </Badge>
      </IconButton>
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-end'
        ref={ref}
        anchorEl={anchorRef.current}
        {...(isSmallScreen
          ? {
              className: 'is-full !mbs-4 z-[1] max-bs-[550px] bs-[550px]',
              modifiers: [
                {
                  name: 'preventOverflow',
                  options: {
                    padding: themeConfig.layoutPadding
                  }
                }
              ]
            }
          : { className: 'is-96 !mbs-4 z-[1] max-bs-[550px] bs-[550px]' })}
      >
        {({ TransitionProps, placement }) => (
          <Fade {...TransitionProps} style={{ transformOrigin: placement === 'bottom-end' ? 'right top' : 'left top' }}>
            <Paper className={classnames('bs-full', settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg')}>
              <ClickAwayListener onClickAway={handleClose}>
                <div className='bs-full flex flex-col'>
                  <div className='flex items-center justify-between plb-3 pli-4 is-full gap-2'>
                    <Typography variant='h6' className='flex-auto'>
                      Notifications
                    </Typography>
                    {unreadCount > 0 && (
                      <Chip variant='tonal' size='small' color='primary' label={`${unreadCount} New`} />
                    )}
                    <Tooltip
                      title={readAll ? 'Mark all as unread' : 'Mark all as read'}
                      placement={placement === 'bottom-end' ? 'left' : 'right'}
                      slotProps={{
                        popper: {
                          sx: {
                            '& .MuiTooltip-tooltip': {
                              transformOrigin:
                                placement === 'bottom-end' ? 'right center !important' : 'right center !important'
                            }
                          }
                        }
                      }}
                    >
                      {notificationsState.length > 0 ? (
                        <IconButton size='small' onClick={() => readAllNotifications()} className='text-textPrimary'>
                          <i className={classnames(readAll ? 'ri-mail-line' : 'ri-mail-open-line', 'text-xl')} />
                        </IconButton>
                      ) : (
                        <></>
                      )}
                    </Tooltip>
                  </div>
                  <Divider />
                  <ScrollWrapper hidden={hidden}>
                    {loading ? (
                      // Loading skeleton
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={classnames('flex plb-3 pli-4 gap-3', { 'border-be': i < 2 })}>
                          <Skeleton variant='circular' width={38} height={38} sx={{ flexShrink: 0 }} />
                          <Box sx={{ flex: 1 }}>
                            <Skeleton variant='text' width='60%' height={20} />
                            <Skeleton variant='text' width='80%' height={16} />
                            <Skeleton variant='text' width='25%' height={14} />
                          </Box>
                        </div>
                      ))
                    ) : notificationsState.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <i
                          className='ri-notification-off-line'
                          style={{ fontSize: '2.5rem', color: 'var(--mui-palette-text-disabled)' }}
                        />
                        <Typography color='text.secondary' variant='body2' sx={{ mt: 1 }}>
                          No notifications
                        </Typography>
                      </Box>
                    ) : (
                      notificationsState.map((notification, index) => {
                        const {
                          id,
                          title,
                          subtitle,
                          time,
                          read,
                          avatarImage,
                          avatarIcon,
                          avatarText,
                          avatarColor,
                          avatarSkin
                        } = notification as NotificationsType & { id: string }

                        return (
                          <div
                            key={id}
                            className={classnames('flex plb-3 pli-4 gap-3 cursor-pointer hover:bg-actionHover group', {
                              'border-be': index !== notificationsState.length - 1
                            })}
                            onClick={() => handleReadNotification(id, index)}
                          >
                            {getAvatar({ avatarImage, avatarIcon, title, avatarText, avatarColor, avatarSkin })}
                            <div className='flex flex-col flex-auto'>
                              <Typography variant='body2' className='font-medium mbe-1' color='text.primary'>
                                {title}
                              </Typography>
                              <Typography variant='caption' className='mbe-2' color='text.secondary'>
                                {subtitle}
                              </Typography>
                              <Typography variant='caption' color='text.disabled'>
                                {time}
                              </Typography>
                            </div>
                            <div className='flex flex-col items-end gap-2'>
                              <Badge
                                variant='dot'
                                color={read ? 'secondary' : 'primary'}
                                onClick={e => { e.stopPropagation(); handleReadNotification(id, index) }}
                                className={classnames('mbs-1 mie-1', {
                                  'invisible group-hover:visible': read
                                })}
                              />
                              <i
                                className='ri-close-line text-xl invisible group-hover:visible text-textSecondary'
                                onClick={e => { e.stopPropagation(); handleRemoveNotification(index) }}
                              />
                            </div>
                          </div>
                        )
                      })
                    )}
                  </ScrollWrapper>
                  <Divider />
                  <div className='p-4'>
                    <Button fullWidth variant='contained' size='small' href='/notifications'>
                      View All Notifications
                    </Button>
                  </div>
                </div>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default NotificationsDropdown
