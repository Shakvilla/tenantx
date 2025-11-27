'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'

// Third-party Imports
import classnames from 'classnames'

type PropertyData = {
  images: string[]
  thumbnailIndex: number
}

const PropertyImagesCard = ({ propertyData }: { propertyData?: PropertyData }) => {
  // States
  const [selectedImageIndex, setSelectedImageIndex] = useState(propertyData?.thumbnailIndex || 0)

  if (!propertyData || !propertyData.images || propertyData.images.length === 0) {
    return (
      <Card>
        <CardHeader title='Property Images' />
        <CardContent>
          <Typography color='text.secondary'>No images available</Typography>
        </CardContent>
      </Card>
    )
  }

  const mainImage = propertyData.images[selectedImageIndex] || propertyData.images[0]

  return (
    <Card>
      <CardHeader title='Property Images' />
      <CardContent>
        <div className='flex flex-col gap-4'>
          {/* Main Image */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 400,
              borderRadius: 1,
              overflow: 'hidden',
              backgroundColor: 'var(--mui-palette-action-hover)'
            }}
          >
            <CardMedia
              component='img'
              image={mainImage}
              alt='Property main image'
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
            {selectedImageIndex === propertyData.thumbnailIndex && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  backgroundColor: 'var(--mui-palette-primary-main)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}
              >
                <i className='ri-star-fill' />
                Thumbnail
              </Box>
            )}
          </Box>

          {/* Thumbnail Grid */}
          {propertyData.images.length > 1 && (
            <Grid container spacing={2}>
              {propertyData.images.map((image, index) => (
                <Grid size={{ xs: 4, sm: 3, md: 2 }} key={index}>
                  <Box
                    onClick={() => setSelectedImageIndex(index)}
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: 100,
                      borderRadius: 1,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: selectedImageIndex === index ? '2px solid' : '1px solid',
                      borderColor:
                        selectedImageIndex === index
                          ? 'var(--mui-palette-primary-main)'
                          : 'var(--mui-palette-divider)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: 'var(--mui-palette-primary-main)',
                        transform: 'scale(1.02)'
                      }
                    }}
                  >
                    <CardMedia
                      component='img'
                      image={image}
                      alt={`Property image ${index + 1}`}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {index === propertyData.thumbnailIndex && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          backgroundColor: 'var(--mui-palette-primary-main)',
                          color: 'white',
                          borderRadius: '50%',
                          width: 20,
                          height: 20,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.625rem'
                        }}
                      >
                        <i className='ri-star-fill' />
                      </Box>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default PropertyImagesCard

