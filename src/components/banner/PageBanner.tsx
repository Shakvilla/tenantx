'use client'

// React Imports
import { useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import { styled, useTheme } from '@mui/material/styles'

// Type Imports
type PageBannerProps = {
  title: string
  description: string
  icon?: string
  image?: string
}

// Styled Components
const StyledBanner = styled(Card)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(5, 6),
  background: `linear-gradient(135deg, var(--mui-palette-primary-main) 0%, var(--mui-palette-primary-light) 100%)`,
  color: 'var(--mui-palette-common-white)',
  boxShadow: 'var(--mui-customShadows-lg)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                 radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)`,
    pointerEvents: 'none'
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    right: '-10%',
    width: '300px',
    height: '300px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '50%',
    pointerEvents: 'none'
  }
}))

const ContentWrapper = styled('div')({
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '2rem'
})

const TextWrapper = styled('div')({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem'
})

const IconWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '120px',
  height: '120px',
  borderRadius: '50%',
  background: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(10px)',
  flexShrink: 0,
  [theme.breakpoints.down('sm')]: {
    width: '80px',
    height: '80px'
  }
}))

const ImageWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '200px',
  height: '200px',
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    width: '150px',
    height: '150px'
  },
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  }
}))

const PageBanner = ({ title, description, icon = 'ri-rocket-line', image }: PageBannerProps) => {
  // Hooks
  const theme = useTheme()

  return (
    <StyledBanner>
      <ContentWrapper>
        <TextWrapper>
          <Typography variant='h4' className='font-bold' sx={{ color: 'var(--mui-palette-common-white)' }}>
            {title}
          </Typography>
          <Typography variant='body1' sx={{ color: 'rgba(255, 255, 255, 0.9)', maxWidth: '600px' }}>
            {description}
          </Typography>
        </TextWrapper>
        {image ? (
          <ImageWrapper>
            <img src={image} alt={title} />
          </ImageWrapper>
        ) : (
          <IconWrapper>
            <i className={`${icon} text-6xl sm:text-5xl`} style={{ color: 'var(--mui-palette-common-white)' }} />
          </IconWrapper>
        )}
      </ContentWrapper>
    </StyledBanner>
  )
}

export default PageBanner
