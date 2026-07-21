'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'

/**
 * Full-viewport loading skeleton for the dashboard.
 *
 * Rendered as a `position: fixed` overlay above the whole app shell (including the
 * sidebar, which otherwise lives in the persistent layout and can't be covered by
 * page-level content). Pure presentational — no props, data, or effects.
 */
const NAV_ITEMS = 8

const DashboardSkeleton = () => {
  return (
    <Box
      aria-busy
      aria-label='Loading dashboard'
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: theme => theme.zIndex.drawer + 2,
        bgcolor: 'background.default',
        display: 'flex',
        overflow: 'hidden'
      }}
    >
      {/* ── Sidebar shell (hidden below lg, matching the real collapsible drawer) ── */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          gap: 2,
          width: 260,
          flexShrink: 0,
          p: 4,
          borderRight: '1px solid',
          borderColor: 'divider'
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Skeleton variant='rounded' width={34} height={34} />
          <Skeleton variant='text' width={120} height={28} />
        </Box>

        {/* Nav items */}
        {Array.from({ length: NAV_ITEMS }).map((_, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 0.5 }}>
            <Skeleton variant='circular' width={22} height={22} />
            <Skeleton variant='text' width={`${55 + ((i * 7) % 35)}%`} height={20} />
          </Box>
        ))}
      </Box>

      {/* ── Main column ── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Navbar strip */}
        <Box
          sx={{
            height: 64,
            flexShrink: 0,
            px: { xs: 4, md: 6 },
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Skeleton variant='rounded' width={220} height={38} sx={{ maxWidth: '40%' }} />
          <Box sx={{ flex: 1 }} />
          <Skeleton variant='circular' width={32} height={32} />
          <Skeleton variant='circular' width={32} height={32} />
          <Skeleton variant='circular' width={38} height={38} />
        </Box>

        {/* Content area */}
        <Box sx={{ flex: 1, overflow: 'hidden', p: { xs: 4, md: 6 }, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Banner */}
          <Skeleton variant='rounded' width='100%' height={120} />

          {/* Row 1: 4 stat cards */}
          <Box
            sx={{
              display: 'grid',
              gap: 6,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }
            }}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant='rounded' height={120} />
            ))}
          </Box>

          {/* Row 2: financial / chart cards */}
          <Box
            sx={{
              display: 'grid',
              gap: 6,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 2fr' }
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant='rounded' height={200} />
            ))}
          </Box>

          {/* Row 3: table */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Skeleton variant='rounded' height={44} />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant='rounded' height={36} />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default DashboardSkeleton
