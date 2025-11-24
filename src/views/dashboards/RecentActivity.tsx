'use client'

// MUI Imports
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import { styled } from '@mui/material/styles'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import TimelineConnector from '@mui/lab/TimelineConnector'
import MuiTimeline from '@mui/lab/Timeline'
import type { TimelineProps } from '@mui/lab/Timeline'

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

const RecentActivity = () => {
  return (
    <Card>
      <CardHeader title='Recent Activity' />
      <CardContent>
        <Timeline>
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color='info' />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <div className='flex flex-wrap items-center justify-between gap-x-2 mbe-2.5'>
                <Typography className='font-medium' color='text.primary'>
                  12 Leases agreements sent
                </Typography>
                <Typography variant='caption'>12 min ago</Typography>
              </div>
              <Typography className='mbe-2'>leases have been sent to the tenants</Typography>
              <div className='flex items-center gap-2.5 is-fit rounded-lg bg-actionHover plb-[5px] pli-2.5'>
                <i className='ri-file-text-line text-xl' />
                <Link href='#' className='font-medium'>
                  lease.pdf
                </Link>
              </div>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color='success' />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <div className='flex flex-wrap items-center justify-between gap-x-2 mbe-2.5'>
                <Typography className='font-medium' color='text.primary'>
                  Meeting with contractor
                </Typography>
                <Typography variant='caption'>45 min ago</Typography>
              </div>
              <Typography className='mbe-2'>Project meeting with john @10:15am</Typography>
              <div className='flex items-center gap-2.5'>
                <Avatar src='/images/avatars/1.png' className='is-8 bs-8' />
                <div className='flex flex-col flex-wrap'>
                  <Typography variant='body2' className='font-medium'>
                    Lester McCarthy (Contractor)
                  </Typography>
                  <Typography variant='body2'>CEO of Lex Construction</Typography>
                </div>
              </div>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color='info' />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <div className='flex flex-wrap items-center justify-between gap-x-2 mbe-2.5'>
                <Typography className='font-medium' color='text.primary'>
                  General Meeting with tenants
                </Typography>
                <Typography variant='caption'>2 Day Ago</Typography>
              </div>
              <Typography className='mbe-2'>6 tenants members in a project</Typography>
              <AvatarGroup total={6} className='pull-up'>
                <Avatar alt='Travis Howard' src='/images/avatars/2.png' />
                <Avatar alt='Agnes Walker' src='/images/avatars/3.png' />
                <Avatar alt='John Doe' src='/images/avatars/6.png' />
              </AvatarGroup>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color='warning' />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <div className='flex flex-wrap items-center justify-between gap-x-2 mbe-2.5'>
                <Typography className='font-medium' color='text.primary'>
                  Messages from tenants
                </Typography>
                <Typography variant='caption'>2 Day Ago</Typography>
              </div>
              <Typography className='mbe-2'>8 Messages from tenants</Typography>
              <AvatarGroup total={8} className='pull-up'>
                <Avatar alt='Travis Howard' src='/images/avatars/2.png' />
                <Avatar alt='Agnes Walker' src='/images/avatars/3.png' />
                <Avatar alt='John Doe' src='/images/avatars/6.png' />
              </AvatarGroup>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color='error' />
            </TimelineSeparator>
            <TimelineContent>
              <div className='flex flex-wrap items-center justify-between gap-x-2 mbe-2.5'>
                <Typography className='font-medium' color='text.primary'>
                  Mortgage Payment Settled
                </Typography>
                <Typography variant='caption'>2 Day Ago</Typography>
              </div>
              <Typography>Mortgage on house finally settled!</Typography>
            </TimelineContent>
          </TimelineItem>
        </Timeline>
      </CardContent>
    </Card>
  )
}

export default RecentActivity

