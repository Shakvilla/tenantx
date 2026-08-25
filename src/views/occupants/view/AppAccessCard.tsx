'use client'

import { useState } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

/**
 * How the tenant gets into the app.
 *
 * Tenants can already report faults, see their invoices and their lease from the
 * occupant app — the account is provisioned the moment they are added, and they
 * sign in with the email or phone on their record, a one-time code, and a password
 * they choose on first use. The
 * landlord portal never said any of that. The Maintenance page is subtitled
 * "requests from tenants" while the landlord has no idea his tenants can send
 * any, which is why it read as a promise the product was not keeping.
 *
 * Deliberately not a "send invite" button: there is no invite endpoint, and
 * adding one means choosing a channel and paying for SMS. Ghanaian landlords
 * send this sort of thing on WhatsApp anyway, so what they need is the words to
 * paste.
 */
const AppAccessCard = ({ name, email, phone }: { name: string; email?: string; phone?: string }) => {
  const [copied, setCopied] = useState(false)

  const signInWith = email?.trim() || phone?.trim() || ''

  const message =
    `Hello ${name.split(' ')[0] || name}, you can now see your rent, your receipts and your tenancy on the ` +
    `TenantX app, and report any repairs directly to me. Download it, enter ${signInWith}, and it will send ` +
    `you a code. The first time, it will ask you to choose a password.`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Card>
      <CardHeader title='Tenant app access' />
      <CardContent className='flex flex-col gap-4'>
        {signInWith ? (
          <>
            <Typography variant='body2'>
              {name.split(' ')[0] || name} already has an account. They sign in to the tenant app with{' '}
              <strong>{signInWith}</strong>, receive a one-time code, and choose a password the first time.
              From there they can see their invoices and report repairs themselves — you do not have to create
              anything for them.
            </Typography>
            <Box>
              <Button
                variant='outlined'
                size='small'
                startIcon={<i className={copied ? 'ri-check-line' : 'ri-file-copy-line'} />}
                onClick={copy}
              >
                {copied ? 'Copied' : 'Copy message for WhatsApp'}
              </Button>
            </Box>
          </>
        ) : (
          <Alert severity='info'>
            This tenant has neither an email address nor a phone number on file, so there is no way for them to
            sign in. Add one to their record and they can use the app.
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default AppAccessCard
