'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline from '@mui/lab/Timeline'
import type { TimelineProps } from '@mui/lab/Timeline'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

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

type ActivityItem = {
  id: number
  date: string
  time: string
  title: string
  description: string
  type: 'created' | 'updated' | 'payment' | 'status_change' | 'property_change'
  details?: {
    propertyName?: string
    unitName?: string
    amount?: string
    status?: string
    oldValue?: string
    newValue?: string
  }
}

// Sample activity data
const sampleActivities: ActivityItem[] = [
  {
    id: 1,
    date: '2024-07-15',
    time: '10:30 AM',
    title: 'Payment Status Updated',
    description: 'Payment status changed from unpaid to paid',
    type: 'payment',
    details: {
      propertyName: 'Xorla House',
      unitName: 'Unit 101',
      amount: '₵1,450',
      oldValue: 'unpaid',
      newValue: 'paid'
    }
  },
  {
    id: 2,
    date: '2024-07-14',
    time: '02:15 PM',
    title: 'Tenant Information Updated',
    description: 'Contact information and address updated',
    type: 'updated',
    details: {
      propertyName: 'Xorla House',
      unitName: 'Unit 101'
    }
  },
  {
    id: 3,
    date: '2024-07-13',
    time: '09:20 AM',
    title: 'Payment Status Updated',
    description: 'Payment status changed from paid to refunded',
    type: 'payment',
    details: {
      propertyName: 'Xorla House',
      unitName: 'Unit 101',
      amount: '₵2,500',
      oldValue: 'paid',
      newValue: 'refunded'
    }
  },
  {
    id: 4,
    date: '2024-07-12',
    time: '04:30 PM',
    title: 'Status Changed',
    description: 'Tenant status changed from active to inactive',
    type: 'status_change',
    details: {
      oldValue: 'active',
      newValue: 'inactive'
    }
  },
  {
    id: 5,
    date: '2024-07-11',
    time: '01:15 PM',
    title: 'Property Assignment',
    description: 'Tenant assigned to new property and unit',
    type: 'property_change',
    details: {
      propertyName: 'Xorla House',
      unitName: 'Unit 101',
      oldValue: 'Sunset Apartments - Unit 301',
      newValue: 'Xorla House - Unit 101'
    }
  },
  {
    id: 6,
    date: '2024-07-10',
    time: '10:00 AM',
    title: 'Tenant Created',
    description: 'New tenant account created',
    type: 'created',
    details: {
      propertyName: 'Sunset Apartments',
      unitName: 'Unit 301'
    }
  }
]

const ActivityTimelineTab = ({ tenantId }: { tenantId: string }) => {
  // In a real app, fetch activities based on tenantId
  const activities = sampleActivities

  // Activity type color mapping
  const activityTypeColor: Record<ActivityItem['type'], 'success' | 'info' | 'warning' | 'error' | 'primary'> = {
    created: 'success',
    updated: 'info',
    payment: 'primary',
    status_change: 'warning',
    property_change: 'error'
  }

  // Activity type icon mapping
  const activityTypeIcon: Record<ActivityItem['type'], string> = {
    created: 'ri-user-add-line',
    updated: 'ri-edit-line',
    payment: 'ri-money-dollar-circle-line',
    status_change: 'ri-refresh-line',
    property_change: 'ri-building-line'
  }

  return (
    <Card>
      <CardHeader title='Activity Timeline' />
      <CardContent>
        <Timeline>
          {activities.map((activity, index) => (
            <TimelineItem key={activity.id}>
              <TimelineSeparator>
                <TimelineDot color={activityTypeColor[activity.type]}>
                  <i className={activityTypeIcon[activity.type]} />
                </TimelineDot>
                {index < activities.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <div className='flex flex-wrap items-center justify-between gap-x-2 mbe-2.5'>
                  <div className='flex items-center gap-2'>
                    <Typography className='font-medium' color='text.primary'>
                      {activity.title}
                    </Typography>
                    <Chip
                      variant='tonal'
                      label={activity.type.replace('_', ' ')}
                      size='small'
                      color={activityTypeColor[activity.type]}
                      className='capitalize'
                    />
                  </div>
                  <div className='flex flex-col items-end'>
                    <Typography variant='caption' color='text.secondary'>
                      {new Date(activity.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {activity.time}
                    </Typography>
                  </div>
                </div>
                <Typography className='mbe-2' color='text.secondary'>
                  {activity.description}
                </Typography>
                {activity.details && (
                  <Box className='flex flex-col gap-2 p-3 bg-actionHover rounded-lg'>
                    {activity.details.propertyName && (
                      <div className='flex items-center gap-2'>
                        <i className='ri-building-line text-lg text-primary' />
                        <Typography variant='body2'>
                          <span className='font-medium'>Property:</span> {activity.details.propertyName}
                        </Typography>
                      </div>
                    )}
                    {activity.details.unitName && (
                      <div className='flex items-center gap-2'>
                        <i className='ri-home-line text-lg text-primary' />
                        <Typography variant='body2'>
                          <span className='font-medium'>Unit:</span> {activity.details.unitName}
                        </Typography>
                      </div>
                    )}
                    {activity.details.amount && (
                      <div className='flex items-center gap-2'>
                        <i className='ri-money-dollar-circle-line text-lg text-primary' />
                        <Typography variant='body2'>
                          <span className='font-medium'>Amount:</span> {activity.details.amount}
                        </Typography>
                      </div>
                    )}
                    {activity.details.oldValue && activity.details.newValue && (
                      <div className='flex items-center gap-2'>
                        <i className='ri-arrow-right-line text-lg text-primary' />
                        <Typography variant='body2'>
                          <span className='font-medium'>Changed:</span> {activity.details.oldValue} →{' '}
                          {activity.details.newValue}
                        </Typography>
                      </div>
                    )}
                    {activity.details.status && (
                      <div className='flex items-center gap-2'>
                        <Chip
                          variant='tonal'
                          label={activity.details.status}
                          size='small'
                          color={
                            activity.details.status === 'paid'
                              ? 'success'
                              : activity.details.status === 'refunded'
                                ? 'error'
                                : 'warning'
                          }
                          className='capitalize w-fit'
                        />
                      </div>
                    )}
                  </Box>
                )}
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  )
}

export default ActivityTimelineTab

