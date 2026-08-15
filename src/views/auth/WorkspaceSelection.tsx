'use client'

// MUI Imports
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActionArea from '@mui/material/CardActionArea'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'

import type { Workspace } from '@/lib/api/auth-client'

interface WorkspaceSelectionProps {
  workspaces: Workspace[]
  onSelect: (workspace: Workspace) => void
  isLoading?: boolean
}

/**
 * Workspace Selection UI
 *
 * Shown after global login when the user belongs to multiple workspaces.
 * Lets the user pick which workspace (tenant) to log into.
 */
const WorkspaceSelection = ({ workspaces, onSelect, isLoading = false }: WorkspaceSelectionProps) => {
  // Map role to a colour for the chip
  const getRoleColor = (role: string): 'primary' | 'secondary' | 'success' | 'warning' | 'info' => {
    const map: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info'> = {
      ADMIN: 'primary',
      MANAGER: 'success',
      OWNER: 'warning',
      OCCUPANT: 'info',
    }

    return map[role.toUpperCase()] ?? 'secondary'
  }

  // Get initials from name for the avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Box>
      <Typography variant='h4' className='mbe-2'>
        Select Workspace
      </Typography>
      <Typography color='text.secondary' className='mbe-6'>
        Choose a workspace to continue
      </Typography>

      <Box className='flex flex-col gap-3'>
        {workspaces.map(workspace => (
          <Card
            key={workspace.tenantId}
            variant='outlined'
            sx={{
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: 2,
                transform: 'translateY(-1px)',
              },
            }}
          >
            <CardActionArea
              onClick={() => onSelect(workspace)}
              disabled={isLoading}
              sx={{ p: 0 }}
            >
              <CardContent
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  py: 3,
                }}
              >
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: 'primary.main',
                    fontSize: '1rem',
                    fontWeight: 600,
                  }}
                >
                  {getInitials(workspace.tenantName)}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant='subtitle1' fontWeight={600} noWrap>
                    {workspace.tenantName}
                  </Typography>
                  {workspace.userType && (
                    <Typography variant='body2' color='text.secondary' noWrap>
                      {workspace.userType}
                    </Typography>
                  )}
                </Box>

                <Chip
                  label={workspace.role}
                  size='small'
                  color={getRoleColor(workspace.role)}
                  variant='tonal'
                />

                {isLoading ? (
                  <CircularProgress size={20} />
                ) : (
                  <i className='ri-arrow-right-s-line' style={{ fontSize: '1.5rem', color: 'inherit' }} />
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  )
}

export default WorkspaceSelection
