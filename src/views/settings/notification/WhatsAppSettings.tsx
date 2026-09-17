'use client'

import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import { whatsAppSettingsApi, type WhatsAppConnection } from '@/lib/api/settings'

type SignupResult = { code?: string }
type MetaSession = { type?: string; event?: string; data?: { waba_id?: string; phone_number_id?: string } }
type FacebookSdk = {
  init: (options: { appId: string; version: string; xfbml: boolean }) => void
  login: (callback: (result: SignupResult) => void, options: Record<string, unknown>) => void
}

declare global {
  interface Window { FB?: FacebookSdk }
}

const WhatsAppSettings = () => {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null)
  const [config, setConfig] = useState<{ appId: string; configId: string; available: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [pin, setPin] = useState('')
  const [registrationConfirmed, setRegistrationConfirmed] = useState(false)

  useEffect(() => {
    Promise.all([whatsAppSettingsApi.status(), whatsAppSettingsApi.signupConfig()])
      .then(([status, signup]) => { setConnection(status); setConfig(signup) })
      .catch(err => setError(err instanceof Error ? err.message : 'Could not load WhatsApp settings'))
  }, [])

  const startSignup = async () => {
    if (!config?.available || busy) return
    setError('')
    setBusy(true)
    let session: MetaSession['data'] | undefined
    const onMessage = (event: MessageEvent) => {
      if (!['https://www.facebook.com', 'https://web.facebook.com'].includes(event.origin)) return
      try {
        const payload = JSON.parse(event.data) as MetaSession
        if (payload.type === 'WA_EMBEDDED_SIGNUP' && payload.event === 'FINISH') session = payload.data
      } catch { /* Meta also posts non-JSON events. */ }
    }
    window.addEventListener('message', onMessage)
    try {
      if (!window.FB) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://connect.facebook.net/en_US/sdk.js'
          script.async = true
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Could not load Meta signup'))
          document.body.appendChild(script)
        })
      }
      if (!window.FB) throw new Error('Meta signup is unavailable')
      window.FB.init({ appId: config.appId, version: 'v21.0', xfbml: true })
      await new Promise<void>((resolve, reject) => {
        window.FB!.login(async result => {
          try {
            if (!result.code || !session?.waba_id || !session?.phone_number_id) {
              throw new Error('Signup was not completed. Please finish all steps in Meta.')
            }
            setConnection(await whatsAppSettingsApi.connect({
              code: result.code, wabaId: session.waba_id, phoneNumberId: session.phone_number_id
            }))
            resolve()
          } catch (err) { reject(err) }
        }, {
          config_id: config.configId,
          response_type: 'code',
          override_default_response_type: true,
          extras: { feature: 'whatsapp_embedded_signup', sessionInfoVersion: '3' }
        })
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'WhatsApp signup failed')
    } finally {
      window.removeEventListener('message', onMessage)
      setBusy(false)
    }
  }

  const changeStatus = async (action: 'activate' | 'pause') => {
    setBusy(true)
    setError('')
    try { setConnection(await whatsAppSettingsApi[action]()) }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not update WhatsApp') }
    finally { setBusy(false) }
  }

  const registerNumber = async () => {
    if (!/^[0-9]{6}$/.test(pin) || !registrationConfirmed) return
    setBusy(true)
    setError('')
    try {
      setConnection(await whatsAppSettingsApi.register(pin))
      setRegistrationConfirmed(false)
    } catch (err) { setError(err instanceof Error ? err.message : 'Meta could not register this number') }
    finally { setPin(''); setBusy(false) }
  }

  return <Card>
    <CardHeader title='WhatsApp' subheader='Send tenancy reminders from your own WhatsApp Business number' />
    <Divider />
    <CardContent>
      <Stack spacing={2}>
        {error && <Alert severity='error'>{error}</Alert>}
        {connection?.status === 'CONNECTED' && <Alert severity='success'>Connected. Eligible reminders can be sent from {connection.displayName}.</Alert>}
        {connection?.status === 'PAUSED' && <Alert severity='info'>Connected but paused. Register the number, add a payment method in Meta, and approve your tenancy templates before activating.</Alert>}
        {connection?.phoneNumber && <Typography>{connection.displayName} · {connection.phoneNumber}</Typography>}
        {connection?.status === 'NOT_CONNECTED' && <Typography variant='body2'>Connect an existing WhatsApp Business Account or create one through Meta. Meta bills your business directly for delivered messages.</Typography>}
        {config && !config.available && <Alert severity='warning'>WhatsApp signup is not yet enabled by the platform.</Alert>}
        {connection?.status === 'PAUSED' && !connection.registered && <Stack spacing={1}>
          <Typography variant='body2'>Set a six-digit two-step verification PIN for this number. Keep it securely; Meta may ask for it again.</Typography>
          <Alert severity='warning'>If this number is already used in the WhatsApp Business app or by another provider, confirm Meta’s supported coexistence or migration path before registering. Its current messaging setup may be interrupted.</Alert>
          <FormControlLabel control={<Checkbox checked={registrationConfirmed}
            onChange={event => setRegistrationConfirmed(event.target.checked)} />}
            label='I have checked the current number setup and understand the possible interruption.' />
          <Stack direction='row' spacing={1}>
            <TextField label='Registration PIN' type='password' size='small' value={pin}
              onChange={event => setPin(event.target.value.replace(/\D/g, '').slice(0, 6))}
              slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 6 } }} />
            <Button variant='outlined' onClick={registerNumber} disabled={busy || pin.length !== 6 || !registrationConfirmed}>Register number</Button>
          </Stack>
        </Stack>}
        <Stack direction='row' spacing={1}>
          <Button variant='contained' onClick={startSignup} disabled={!config?.available || busy}>
            {connection?.status === 'NOT_CONNECTED' ? 'Connect WhatsApp' : 'Change number'}
          </Button>
          {connection?.status === 'PAUSED' && <Button variant='outlined' onClick={() => changeStatus('activate')} disabled={busy || !connection.registered}>Activate</Button>}
          {connection?.status === 'CONNECTED' && <Button variant='outlined' color='warning' onClick={() => changeStatus('pause')} disabled={busy}>Pause</Button>}
        </Stack>
      </Stack>
    </CardContent>
  </Card>
}

export default WhatsAppSettings
