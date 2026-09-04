'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'

import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { AdminBrandingProvider, useAdminBranding } from '@/contexts/AdminBrandingContext'
import { adminNavItems, type AdminNavItem } from '@/data/adminMenuData'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DRAWER_WIDTH = 280            // expanded sidebar
const COLLAPSED_WIDTH = 64          // icon-only sidebar
const SIDEBAR_STORAGE_KEY = 'admin-sidebar-collapsed'
const SIDEBAR_TRANSITION = 'width 200ms ease, margin-left 200ms ease, margin-right 200ms ease'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// ---------------------------------------------------------------------------
// Nav item component
// ---------------------------------------------------------------------------

function NavItem({
  item,
  collapsed,
  onClick,
}: {
  item: AdminNavItem
  collapsed: boolean
  onClick?: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()

  // Exact match for dashboard, prefix match for others
  const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)

  const button = (
    <ListItemButton
      selected={isActive}
      onClick={() => {
        router.push(item.href)
        onClick?.()
      }}
      sx={{
        mx: 1,
        borderRadius: 1,
        justifyContent: collapsed ? 'center' : 'flex-start',
        px: collapsed ? 0 : 2,
        '&.Mui-selected': {
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': { bgcolor: 'primary.dark' },
          '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
          '& .MuiListItemText-primary': { color: 'primary.contrastText' },
        },
      }}
    >
      <ListItemIcon
        sx={{
          minWidth: collapsed ? 0 : 36,
          justifyContent: 'center',
          color: isActive ? 'primary.contrastText' : 'text.secondary',
        }}
      >
        <i className={item.icon} style={{ fontSize: '1.25rem' }} />
      </ListItemIcon>
      {!collapsed && (
        <ListItemText
          primary={item.label}
          slotProps={{
            primary: {
              variant: 'body2',
              fontWeight: isActive ? 600 : 400,
              sx: { color: isActive ? 'primary.contrastText' : 'text.primary' },
            },
          }}
        />
      )}
    </ListItemButton>
  )

  return (
    <ListItem disablePadding sx={{ py: collapsed ? 0.125 : 0.25 }}>
      {collapsed ? (
        <Tooltip title={item.label} placement='right' arrow>
          {button}
        </Tooltip>
      ) : (
        button
      )}
    </ListItem>
  )
}

// ---------------------------------------------------------------------------
// Sidebar content
// ---------------------------------------------------------------------------

function SidebarContent({
  collapsed,
  onToggleCollapse,
  onClose,
}: {
  collapsed: boolean
  onToggleCollapse?: () => void
  onClose?: () => void
}) {
  const { adminUser, adminLogout, hasPermission } = useAdminAuth()
  const { platformName, logoUrl } = useAdminBranding()

  const visibleItems = adminNavItems.filter(item => {
    if (!item.permissions) return true                           // open to all admins
    return item.permissions.some(p => hasPermission(p))        // any of the listed perms
  })

  // Group consecutive items by section, preserving source order
  const groups: Array<{ section: string | null; items: AdminNavItem[] }> = []
  for (const item of visibleItems) {
    const last = groups[groups.length - 1]
    if (last && last.section === (item.section ?? null)) {
      last.items.push(item)
    } else {
      groups.push({ section: item.section ?? null, items: [item] })
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Logo + branding + collapse toggle ───────────────────────────── */}
      <Box
        sx={{
          px: collapsed ? 2 : 3,
          py: 2.5,
          display: 'flex',
          flexDirection: collapsed ? 'column' : 'row',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 1.5,
          }}
        >
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoUrl}
              alt={platformName}
              style={{
                maxHeight: collapsed ? 32 : 36,
                maxWidth: collapsed ? 36 : 140,
                objectFit: 'contain',
              }}
            />
          ) : (
            <Box
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: 1,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <i className='ri-building-4-line' style={{ color: '#fff', fontSize: '1.25rem' }} />
            </Box>
          )}
          {!collapsed && (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant='subtitle1' fontWeight={700} lineHeight={1.2} noWrap>
                {platformName}
              </Typography>
              <Typography variant='caption' color='text.secondary' noWrap>
                Platform Admin
              </Typography>
            </Box>
          )}
        </Box>

        {onToggleCollapse && (
          <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement='right' arrow>
            <IconButton
              size='small'
              onClick={onToggleCollapse}
              sx={{
                flexShrink: 0,
                color: 'text.secondary',
                '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
              }}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <i className={collapsed ? 'ri-indent-increase' : 'ri-indent-decrease'} style={{ fontSize: '1.15rem' }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Divider />

      {/* ── Navigation items ─────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
        {groups.map(group => (
          <Box key={group.section ?? '__root__'}>
            {!collapsed && group.section && (
              <Typography
                sx={{
                  px: 3,
                  pt: 1.5,
                  pb: 0.5,
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'text.disabled',
                  userSelect: 'none',
                }}
              >
                {group.section}
              </Typography>
            )}
            <List disablePadding>
              {group.items.map(item => (
                <NavItem key={item.href} item={item} collapsed={collapsed} onClick={onClose} />
              ))}
            </List>
          </Box>
        ))}
      </Box>

      <Divider />

      {/* ── User info + logout ───────────────────────────────────────────── */}
      <Box
        sx={{
          px: collapsed ? 1 : 2,
          py: 2,
          display: 'flex',
          flexDirection: collapsed ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: 1.5,
        }}
      >
        <Tooltip
          title={collapsed ? (adminUser?.fullName ?? 'Admin') : ''}
          placement='right'
          arrow
          disableHoverListener={!collapsed}
        >
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light', fontSize: '0.875rem' }}>
            {adminUser ? getInitials(adminUser.fullName) : '?'}
          </Avatar>
        </Tooltip>
        {!collapsed && (
          <>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant='body2' fontWeight={600} noWrap>
                {adminUser?.fullName ?? '—'}
              </Typography>
              <Typography variant='caption' color='text.secondary' noWrap>
                {adminUser?.roles.join(', ') ?? ''}
              </Typography>
            </Box>
            <Tooltip title='Logout'>
              <IconButton size='small' onClick={adminLogout} color='error'>
                <i className='ri-logout-box-r-line' style={{ fontSize: '1.1rem' }} />
              </IconButton>
            </Tooltip>
          </>
        )}
        {collapsed && (
          <Tooltip title='Logout' placement='right' arrow>
            <IconButton size='small' onClick={adminLogout} color='error'>
              <i className='ri-logout-box-r-line' style={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Admin AppBar (mobile toggle + desktop title injected via slot)
// ---------------------------------------------------------------------------

export function AdminAppBar({
  title,
  onMenuOpen,
  collapsed,
}: {
  title: string
  onMenuOpen: () => void
  collapsed?: boolean
}) {
  const offsetWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH

  return (
    <AppBar
      position='fixed'
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${offsetWidth}px)` },
        ml: { md: `${offsetWidth}px` },
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        color: 'text.primary',
        transition: SIDEBAR_TRANSITION,
      }}
    >
      <Toolbar variant='dense' sx={{ minHeight: 56 }}>
        <IconButton edge='start' onClick={onMenuOpen} sx={{ mr: 1, display: { md: 'none' } }}>
          <i className='ri-menu-line' />
        </IconButton>
        <Typography variant='h6' fontWeight={600}>
          {title}
        </Typography>
      </Toolbar>
    </AppBar>
  )
}

// ---------------------------------------------------------------------------
// Route → title mapping
// ---------------------------------------------------------------------------

const ROUTE_TITLES: Array<{ match: (p: string) => boolean; title: string }> = [
  { match: p => p === '/admin',                           title: 'Dashboard' },
  { match: p => p.startsWith('/admin/tenants/'),          title: 'Tenant Details' },
  { match: p => p === '/admin/tenants',                   title: 'Tenants' },
  { match: p => p === '/admin/users',                     title: 'Platform Users' },
  { match: p => p.startsWith('/admin/admins/'),           title: 'Admin Details' },
  { match: p => p === '/admin/admins',                    title: 'System Admins' },
  { match: p => p === '/admin/subscriptions',             title: 'Subscription Plans' },
  { match: p => p === '/admin/profile',                   title: 'My Profile' },
  { match: p => p === '/admin/announcements',              title: 'Announcements' },
  { match: p => p === '/admin/messaging',                  title: 'Messaging' },
  { match: p => p === '/admin/reports',                    title: 'Reports' },
  { match: p => p === '/admin/support',                    title: 'Support & Feedback' },
  { match: p => p === '/admin/platform-settings',          title: 'Platform Settings' },
  { match: p => p === '/admin/audit-log',                  title: 'Audit Log' },
  { match: p => p === '/admin/fee-ledger',                 title: 'Fee Ledger' },
]

function usePageTitle(): string {
  const pathname = usePathname()
  return ROUTE_TITLES.find(r => r.match(pathname))?.title ?? 'Admin'
}

// ---------------------------------------------------------------------------
// Main export: AdminNavigation (sidebar drawer + mobile toggle)
// ---------------------------------------------------------------------------

interface AdminNavigationProps {
  children: React.ReactNode
}

export function AdminNavigation({ children }: AdminNavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const pageTitle = usePageTitle()

  // Restore persisted collapsed state after mount (avoids hydration mismatch)
  useEffect(() => {
    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null) setCollapsed(stored === 'true')
  }, [])

  const handleToggleCollapse = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      return next
    })
  }, [])

  const desktopWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH

  return (
    <AdminBrandingProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* ── Permanent desktop drawer ─────────────────────────────────────── */}
        <Box
          component='nav'
          sx={{ width: { md: desktopWidth }, flexShrink: { md: 0 }, transition: SIDEBAR_TRANSITION }}
        >
          {/* Mobile: temporary */}
          <Drawer
            variant='temporary'
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
              },
            }}
          >
            <SidebarContent collapsed={false} onClose={() => setMobileOpen(false)} />
          </Drawer>

          {/* Desktop: permanent */}
          <Drawer
            variant='permanent'
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                width: desktopWidth,
                boxSizing: 'border-box',
                borderRight: '1px solid',
                borderColor: 'divider',
                overflowX: 'hidden',
                transition: SIDEBAR_TRANSITION,
              },
            }}
            open
          >
            <SidebarContent collapsed={collapsed} onToggleCollapse={handleToggleCollapse} />
          </Drawer>
        </Box>

        {/* ── Main content area ──────────────────────────────────────────────── */}
        <Box
          component='main'
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
          }}
        >
          <AdminAppBar title={pageTitle} onMenuOpen={() => setMobileOpen(true)} collapsed={collapsed} />

          {/* Offset for fixed AppBar */}
          <Box sx={{ mt: '56px', flex: 1, p: { xs: 2, md: 3 } }}>
            {children}
          </Box>
        </Box>
      </Box>
    </AdminBrandingProvider>
  )
}