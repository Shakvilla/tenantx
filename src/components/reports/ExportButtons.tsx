// Documentation: /docs/reports/reports-flow.md

'use client'

// MUI Imports
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

// Util Imports
import { exportToPDF, exportToExcel, exportToCSV } from '@/utils/reports/exportUtils'

type Props = {
  title: string
  data: any[]
  filename: string
  contentRef?: React.RefObject<HTMLElement>
}

const ExportButtons = ({ title, data, filename, contentRef }: Props) => {
  const handleExportPDF = async () => {
    if (contentRef?.current) {
      await exportToPDF(title, contentRef.current, filename)
    }
  }

  const handleExportExcel = () => {
    exportToExcel(data, filename)
  }

  const handleExportCSV = () => {
    exportToCSV(data, filename)
  }

  return (
    <Box className='flex gap-2'>
      <Button
        variant='outlined'
        color='primary'
        size='small'
        onClick={handleExportPDF}
        startIcon={<i className='ri-file-pdf-line' />}
        disabled={!contentRef?.current}
      >
        PDF
      </Button>
      <Button
        variant='outlined'
        color='primary'
        size='small'
        onClick={handleExportExcel}
        startIcon={<i className='ri-file-excel-2-line' />}
        disabled={data.length === 0}
      >
        Excel
      </Button>
      <Button
        variant='outlined'
        color='primary'
        size='small'
        onClick={handleExportCSV}
        startIcon={<i className='ri-file-text-line' />}
        disabled={data.length === 0}
      >
        CSV
      </Button>
    </Box>
  )
}

export default ExportButtons

