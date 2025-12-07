// Documentation: /docs/settings/settings-module.md

'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'

// Type Imports
import type { EmailTemplateType } from '@/types/settings/notificationTypes'

// Utils Imports
import { notificationSettingsApi } from '@/utils/settings/api'

// MUI Imports
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

const TEMPLATE_TYPES: { value: EmailTemplateType; label: string }[] = [
  { value: 'invoice_sent', label: 'Invoice Sent' },
  { value: 'payment_received', label: 'Payment Received' },
  { value: 'payment_reminder', label: 'Payment Reminder' },
  { value: 'tenant_welcome', label: 'Tenant Welcome' },
  { value: 'maintenance_request', label: 'Maintenance Request' },
  { value: 'invoice_due', label: 'Invoice Due' },
  { value: 'payment_overdue', label: 'Payment Overdue' }
]

const TEMPLATE_VARIABLES = [
  { key: '{{tenant_name}}', label: 'Tenant Name', description: 'Name of the tenant', example: 'John Doe' },
  { key: '{{amount}}', label: 'Amount', description: 'Payment or invoice amount', example: '₵1,500.00' },
  {
    key: '{{invoice_number}}',
    label: 'Invoice Number',
    description: 'Invoice reference number',
    example: 'INV-2024-001'
  },
  { key: '{{property_name}}', label: 'Property Name', description: 'Name of the property', example: 'Apartment 3B' },
  { key: '{{due_date}}', label: 'Due Date', description: 'Payment due date', example: '2024-01-15' },
  { key: '{{company_name}}', label: 'Company Name', description: 'Your company name', example: 'Your Company' },
  { key: '{{payment_date}}', label: 'Payment Date', description: 'Date of payment', example: '2024-01-10' }
]

const EmailTemplatesSettings = () => {
  // States
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateType>('invoice_sent')
  const [subject, setSubject] = useState('Invoice #{{invoice_number}} - Payment Due')
  const [body, setBody] = useState(
    'Dear {{tenant_name}},\n\nYour invoice #{{invoice_number}} for {{property_name}} is due on {{due_date}}.\n\nAmount: {{amount}}\n\nThank you,\n{{company_name}}'
  )
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      const template = {
        id: selectedTemplate,
        type: selectedTemplate,
        name: TEMPLATE_TYPES.find(t => t.value === selectedTemplate)?.label || '',
        subject,
        body,
        variables: TEMPLATE_VARIABLES,
        isDefault: false
      }

      // Get current templates and update the selected one
      const currentSettings = await notificationSettingsApi.get()
      const updatedTemplates = currentSettings.emailTemplates.map(t => (t.type === selectedTemplate ? template : t))

      await notificationSettingsApi.update({ emailTemplates: updatedTemplates })
      setSnackbar({ open: true, message: 'Email template saved successfully', severity: 'success' })
    } catch (error) {
      console.error('Error saving email template:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save email template',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    setLoading(true)
    try {
      // Load default template from API
      const settings = await notificationSettingsApi.get()
      const defaultTemplate = settings.emailTemplates.find(t => t.type === selectedTemplate && t.isDefault)

      if (defaultTemplate) {
        setSubject(defaultTemplate.subject)
        setBody(defaultTemplate.body)
        setSnackbar({ open: true, message: 'Template reset to default', severity: 'success' })
      } else {
        // Fallback to hardcoded default
        setSubject('Invoice #{{invoice_number}} - Payment Due')
        setBody(
          'Dear {{tenant_name}},\n\nYour invoice #{{invoice_number}} for {{property_name}} is due on {{due_date}}.\n\nAmount: {{amount}}\n\nThank you,\n{{company_name}}'
        )
        setSnackbar({ open: true, message: 'Template reset to default', severity: 'success' })
      }
    } catch (error) {
      console.error('Error loading default template:', error)
      // Fallback to hardcoded default
      setSubject('Invoice #{{invoice_number}} - Payment Due')
      setBody(
        'Dear {{tenant_name}},\n\nYour invoice #{{invoice_number}} for {{property_name}} is due on {{due_date}}.\n\nAmount: {{amount}}\n\nThank you,\n{{company_name}}'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title='Email Templates' subheader='Customize email templates for different notification types' />
      <Divider />
      <CardContent className='flex flex-col gap-6'>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Template Type</InputLabel>
              <Select
                value={selectedTemplate}
                onChange={e => setSelectedTemplate(e.target.value as EmailTemplateType)}
                label='Template Type'
              >
                {TEMPLATE_TYPES.map(template => (
                  <MenuItem key={template.value} value={template.value}>
                    {template.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size='small'
              label='Email Subject'
              value={subject}
              onChange={e => setSubject(e.target.value)}
              helperText='Subject line for the email (use variables like {{tenant_name}})'
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={8}
              label='Email Body'
              value={body}
              onChange={e => setBody(e.target.value)}
              helperText='Email body content (use variables like {{amount}}, {{invoice_number}})'
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Paper variant='outlined' className='p-4'>
              <Typography variant='body2' className='font-medium mb-2'>
                Available Template Variables
              </Typography>
              <Box className='flex flex-wrap gap-2'>
                {TEMPLATE_VARIABLES.map(variable => (
                  <Chip
                    key={variable.key}
                    label={`${variable.key} - ${variable.label}`}
                    size='small'
                    variant='outlined'
                    title={`Example: ${variable.example}`}
                  />
                ))}
              </Box>
              <Typography variant='caption' color='text.secondary' className='mt-2 block'>
                Click on a variable to see its example value. Use these variables in your template to personalize
                emails.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <div className='flex justify-end gap-2'>
          <Button variant='outlined' color='secondary' onClick={handleReset} disabled={loading}>
            Reset to Default
          </Button>
          <Button variant='contained' color='primary' onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Template'}
          </Button>
        </div>
      </CardContent>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  )
}

export default EmailTemplatesSettings
