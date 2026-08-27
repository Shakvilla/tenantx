'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Tooltip from '@mui/material/Tooltip'

import Button from '@mui/material/Button'

import { getDocuments, type DocumentItem } from '@/lib/api/documents'
import AddDocumentDialog from '@/views/documents/AddDocumentDialog'

const STATUS_COLOR: Record<DocumentItem['status'], 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error'
}

function fileIcon(item: DocumentItem) {
  const name = (item.fileName || '').toLowerCase()
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(name)) return <i className='ri-image-line text-2xl' />
  if (/\.pdf$/.test(name)) return <i className='ri-file-pdf-line text-2xl' />
  return <i className='ri-file-text-line text-2xl' />
}

function prettyType(type: string) {
  return type.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const DocumentationTab = ({ occupantId, occupantName }: { occupantId?: string; occupantName?: string }) => {
  // The tab listed documents and offered no way to add one: upload lived only in the top-level
  // Documents section, so filing a tenant's signed agreement meant leaving the tenant, finding
  // the section, and picking them out of a list again.
  const [uploadOpen, setUploadOpen] = useState(false)
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!occupantId) {
      setDocuments([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    // Backend /documents filters by status/type only, so filter to this occupant client-side.
    getDocuments()
      .then(all => {
        if (!cancelled) setDocuments((all ?? []).filter(d => d.occupantId === occupantId))
      })
      .catch(() => { if (!cancelled) setError('Failed to load documents') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [occupantId, reloadKey])

  const handleDownload = (item: DocumentItem) => {
    if (item.fileUrl) window.open(item.fileUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card elevation={0}>
      <CardContent className='flex flex-col gap-6'>
        <Typography variant='h5' className='font-medium'>
          Documents
        </Typography>

        {occupantId && documents.length > 0 && (
          <Box className='flex justify-end'>
            <Button
              size='small'
              variant='outlined'
              startIcon={<i className='ri-upload-2-line' />}
              onClick={() => setUploadOpen(true)}
            >
              Upload a document
            </Button>
          </Box>
        )}

        {error && <Alert severity='error'>{error}</Alert>}

        {loading ? (
          <Box className='flex items-center justify-center py-12'>
            <CircularProgress />
          </Box>
        ) : documents.length === 0 ? (
          <Box className='flex flex-col items-center justify-center gap-3 py-12'>
            <Typography variant='body2' color='text.secondary'>
              No documents yet
            </Typography>
            {occupantId && (
              <Button
                size='small'
                variant='outlined'
                startIcon={<i className='ri-upload-2-line' />}
                onClick={() => setUploadOpen(true)}
              >
                Upload a document
              </Button>
            )}
          </Box>
        ) : (
          <Box className='flex flex-col gap-4'>
            {documents.map(document => (
              <Box
                key={document.id}
                className='flex items-center justify-between gap-4 p-4 border rounded-lg hover:bg-actionHover transition-colors'
              >
                <Box className='flex items-center gap-4 flex-1 min-w-0'>
                  <Avatar
                    variant='rounded'
                    sx={{ width: 48, height: 48, bgcolor: 'primary.main', color: 'primary.contrastText' }}
                  >
                    {fileIcon(document)}
                  </Avatar>
                  <Box className='flex flex-col min-w-0'>
                    <Typography color='text.primary' className='font-medium' noWrap>
                      {document.fileName || prettyType(document.documentType)}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {prettyType(document.documentType)}
                    </Typography>
                  </Box>
                </Box>
                <Box className='flex items-center gap-2 flex-shrink-0'>
                  <Chip
                    size='small'
                    variant='tonal'
                    label={document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                    color={STATUS_COLOR[document.status] ?? 'default'}
                  />
                  <Tooltip title={document.fileUrl ? 'Download' : 'No file attached'}>
                    <span>
                      <IconButton
                        onClick={() => handleDownload(document)}
                        disabled={!document.fileUrl}
                        className='text-primary'
                        size='small'
                      >
                        <i className='ri-download-line text-xl' />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>

      {occupantId && (
        <AddDocumentDialog
          open={uploadOpen}
          setOpen={setUploadOpen}
          presetOccupant={{ id: occupantId, name: occupantName }}
          onSuccess={() => { setUploadOpen(false); setReloadKey(k => k + 1) }}
        />
      )}
    </Card>
  )
}

export default DocumentationTab
