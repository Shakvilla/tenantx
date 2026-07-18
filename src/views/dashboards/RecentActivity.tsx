'use client'

// React Imports
import { useEffect, useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import { styled } from '@mui/material/styles'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline from '@mui/lab/Timeline'
import type { TimelineProps } from '@mui/lab/Timeline'
import type { ThemeColor } from '@core/types'

// API Imports
import { getInAppNotifications, type InAppNotification } from '@/lib/api/notifications'

// Styled Timeline component
const Timeline = styled(MuiTimeline)<TimelineProps>({
  paddingLeft: 0,
  paddingRight: 0,
  '& .MuiTimelineItem-root': {
    width: '100%',
    '&:before': {
      display: 'none'
    }
  }
})

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

function dotColor(entityType: string | null): ThemeColor {
  switch (entityType) {
    case 'MAINTENANCE_REQUEST':
      return 'warning'
    case 'INVOICE':
    case 'PAYMENT':
      return 'success'
    case 'AGREEMENT':
      return 'primary'
    default:
      return 'info'
  }
}

const RecentActivity = () => {
  const [items, setItems] = useState<InAppNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getInAppNotifications({ size: 5 })
      .then(res => setItems(res.content ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader title='Recent Activity' />
      <CardContent sx={{ flex: 1 }}>
        {loading ? (
          <div className='flex flex-col gap-4'>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} variant='rounded' height={60} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Typography color='text.secondary'>No recent activity yet.</Typography>
        ) : (
          <Timeline>
            {items.map((item, index) => (
              <TimelineItem key={item.id}>
                <TimelineSeparator>
                  <TimelineDot color={dotColor(item.entityType)} />
                  {index < items.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <div className='flex flex-wrap items-center justify-between gap-x-2 mbe-2.5'>
                    <Typography className='font-medium' color='text.primary'>
                      {item.title}
                    </Typography>
                    <Typography variant='caption'>{relativeTime(item.createdAt)}</Typography>
                  </div>
                  {item.body && <Typography>{item.body}</Typography>}
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </CardContent>
    </Card>
  )
}

export default RecentActivity
