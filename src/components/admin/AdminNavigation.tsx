'use client'

import { useState } from 'react'
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
import { adminNavItems, type AdminNavItem } from '@/data/adminMenuData'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DRAWER_WIDTH = 260

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

function NavItem({ item, onClick }: { item: AdminNavItem; onClick?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()

  // Exact match for dashboard, prefix match for others
  const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)

  return (
    <ListItem disablePadding>
      <ListItemButton
        selected={isActive}
        onClick={() => {
          router.push(item.href)
          onClick?.()
        }}
        sx={{
          mx: 1,
          borderRadius: 1,
          '&.Mui-selected': {
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.dark' },
            '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
            '& .MuiListItemText-primary': { color: 'primary.contrastText' },
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 36, color: isActive ? 'primary.contrastText' : 'text.secondary' }}>
          <i className={item.icon} style={{ fontSize: '1.25rem' }} />
        </ListItemIcon>
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
      </ListItemButton>
    </ListItem>
  )
}

// ---------------------------------------------------------------------------
// Sidebar content
// ---------------------------------------------------------------------------

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { adminUser, adminLogout, hasPermission } = useAdminAuth()

  const visibleItems = adminNavItems.filter(item => {
    if (!item.permissions) return true                           // open to all admins
    return item.permissions.some(p => hasPermission(p))        // any of the listed perms
  })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Logo + branding ─────────────────────────────────────────────── */}
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1,
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className='ri-building-4-line' style={{ color: '#fff', fontSize: '1.25rem' }} />
        </Box>
        <Box>
          <Typography variant='subtitle1' fontWeight={700} lineHeight={1.2}>
            TenantX
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            Platform Admin
          </Typography>
        </Box>
      </Box>

      <Divider />

      {/* ── Navigation items ─────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        <List disablePadding>
          {visibleItems.map(item => (
            <NavItem key={item.href} item={item} onClick={onClose} />
          ))}
        </List>
      </Box>

      <Divider />

      {/* ── User info + logout ───────────────────────────────────────────── */}
      <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.light', fontSize: '0.875rem' }}>
          {adminUser ? getInitials(adminUser.fullName) : '?'}
        </Avatar>
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
}: {
  title: string
  onMenuOpen: () => void
}) {
  return (
    <AppBar
      position='fixed'
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { md: `${DRAWER_WIDTH}px` },
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        color: 'text.primary',
      }}
    >
      <Toolbar variant='dense' sx={{ minHeight: 56 }}>
        <IconButton
          edge='start'
          onClick={onMenuOpen}
          sx={{ mr: 1, display: { md: 'none' } }}
        >
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
// Main export: AdminNavigation (sidebar drawer + mobile toggle)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Route → title mapping
// ---------------------------------------------------------------------------

const ROUTE_TITLES: Array<{ match: (p: string) => boolean; title: string }> = [
  { match: p => p === '/admin',                           title: 'Dashboard' },
  { match: p => p.startsWith('/admin/tenants/'),          title: 'Tenant Details' },
  { match: p => p === '/admin/tenants',                   title: 'Tenants' },
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
  const pageTitle = usePageTitle()

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* ── Permanent desktop drawer ─────────────────────────────────────── */}
      <Box
        component='nav'
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
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
          <SidebarContent onClose={() => setMobileOpen(false)} />
        </Drawer>

        {/* Desktop: permanent */}
        <Drawer
          variant='permanent'
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          <SidebarContent />
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
        <AdminAppBar title={pageTitle} onMenuOpen={() => setMobileOpen(true)} />

        {/* Offset for fixed AppBar */}
        <Box sx={{ mt: '56px', flex: 1, p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
