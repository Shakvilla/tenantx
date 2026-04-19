'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'

type UnitViewData = {
  images: string[]
}

const UnitImagesCard = ({ unitData }: { unitData?: UnitViewData }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  if (!unitData || !unitData.images || unitData.images.length === 0) {
    return (
      <Card>
        <CardHeader title='Unit Images' />
        <CardContent>
          <Typography color='text.secondary'>No images available for this unit.</Typography>
        </CardContent>
      </Card>
    )
  }

  const mainImage = unitData.images[selectedImageIndex] || unitData.images[0]

  return (
    <Card>
      <CardHeader title='Unit Images' />
      <CardContent>
        <div className='flex flex-col gap-4'>
          {/* Main Image Viewer */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: { xs: 250, sm: 400 },
              borderRadius: 1,
              overflow: 'hidden',
              backgroundColor: 'var(--mui-palette-action-hover)',
              boxShadow: 'var(--mui-customShadows-xs)'
            }}
          >
            <CardMedia
              component='img'
              image={mainImage}
              alt='Unit main image'
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>

          {/* Thumbnails Grid */}
          {unitData.images.length > 1 && (
            <Grid container spacing={2}>
              {unitData.images.map((image, index) => (
                <Grid size={{ xs: 4, sm: 3, md: 2 }} key={index}>
                  <Box
                    onClick={() => setSelectedImageIndex(index)}
                    sx={{
                      position: 'relative',
                      width: '100%',
                      height: 80,
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
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardMedia
                      component='img'
                      image={image}
                      alt={`Unit thumbnail ${index + 1}`}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
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

export default UnitImagesCard
