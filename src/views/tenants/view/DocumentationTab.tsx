'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'

type Document = {
  id: string
  name: string
  type: string
  size?: string
  url?: string
}

// Sample documents data
const sampleDocuments: Document[] = [
  {
    id: '1',
    name: 'Invoice file.PNG',
    type: 'image/png',
    size: '2.5 MB',
    url: '#'
  },
  {
    id: '2',
    name: 'Lease Agreement.pdf',
    type: 'application/pdf',
    size: '1.2 MB',
    url: '#'
  },
  {
    id: '3',
    name: 'ID Card.jpg',
    type: 'image/jpeg',
    size: '800 KB',
    url: '#'
  },
  {
    id: '4',
    name: 'Contract Document.pdf',
    type: 'application/pdf',
    size: '3.1 MB',
    url: '#'
  }
]

const DocumentationTab = () => {
  // States
  const [documents] = useState<Document[]>(sampleDocuments)

  const handleDownload = (document: Document) => {
    // In a real app, this would trigger the download
    console.log('Downloading:', document.name)

    if (document.url) {
      window.open(document.url, '_blank')
    }
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <i className='ri-image-line text-2xl' />
    } else if (type.includes('pdf')) {
      return <i className='ri-file-pdf-line text-2xl' />
    } else {
      return <i className='ri-file-text-line text-2xl' />
    }
  }

  return (
    <Card>
      <CardContent className='flex flex-col gap-6'>
        <Typography variant='h5' className='font-medium'>
          Documents
        </Typography>

        {documents.length === 0 ? (
          <Box className='flex items-center justify-center py-12'>
            <Typography variant='body2' color='text.secondary'>
              No documents available
            </Typography>
          </Box>
        ) : (
          <Box className='flex flex-col gap-4'>
            {documents.map(document => (
              <Box
                key={document.id}
                className='flex items-center justify-between gap-4 p-4 border rounded-lg hover:bg-actionHover transition-colors'
              >
                <Box className='flex items-center gap-4 flex-1'>
                  <Avatar
                    variant='rounded'
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText'
                    }}
                  >
                    {getFileIcon(document.type)}
                  </Avatar>
                  <Box className='flex flex-col'>
                    <Typography color='text.primary' className='font-medium'>
                      {document.name}
                    </Typography>
                    {document.size && (
                      <Typography variant='body2' color='text.secondary'>
                        {document.size}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <IconButton
                  onClick={() => handleDownload(document)}
                  className='text-primary'
                  size='small'
                >
                  <i className='ri-download-line text-xl' />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default DocumentationTab

