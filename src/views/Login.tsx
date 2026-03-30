'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { Mode } from '@core/types'
import type { Workspace } from '@/lib/api/auth-client'

// Component Imports
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'
import WorkspaceSelection from '@views/auth/WorkspaceSelection'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'
import { useAuth } from '@/contexts/AuthContext'

const LoginV2 = ({ mode }: { mode: Mode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Vars
  const darkImg = '/images/pages/auth-v2-mask-1-dark.png'
  const lightImg = '/images/pages/auth-v2-mask-1-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-login-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-login-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-login-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-login-light-border.png'

  // Hooks
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings } = useSettings()
  const { login, needsWorkspaceSelection, pendingWorkspaces, selectWorkspace } = useAuth()
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  // Message from query params (e.g. session expired)
  const message = searchParams.get('message')

  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = await login(email, password)

    if (!result.success) {
      setError(result.error || 'Login failed. Please check your credentials.')
    }

    // If workspace selection is needed, the component will re-render with the selection UI
    // If auto-selected (single workspace), redirect to dashboard
    if (result.success && !needsWorkspaceSelection) {
      // Small delay to let the state settle (auto-select case)
      setTimeout(() => {
        router.push('/dashboard')
      }, 100)
    }

    setIsSubmitting(false)
  }

  const handleWorkspaceSelect = async (workspace: Workspace) => {
    setError(null)
    setIsSubmitting(true)

    const result = await selectWorkspace(workspace)

    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error || 'Failed to select workspace.')
    }

    setIsSubmitting(false)
  }

  // ---------------------------------------------------------------------------
  // Workspace Selection View
  // ---------------------------------------------------------------------------
  if (needsWorkspaceSelection && pendingWorkspaces && pendingWorkspaces.length > 0) {
    return (
      <div className='flex bs-full justify-center'>
        <div
          className={classnames(
            'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
            {
              'border-ie': settings.skin === 'bordered'
            }
          )}
        >
          <div className='pli-6 max-lg:mbs-40 lg:mbe-24'>
            <img
              src={characterIllustration}
              alt='character-illustration'
              className='max-bs-[673px] max-is-full bs-auto'
            />
          </div>
          <img src={authBackground} className='absolute bottom-[4%] z-[-1] is-full max-md:hidden' />
        </div>
        <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
          <Link className='absolute block-start-5 sm:block-start-[38px] inline-start-6 sm:inline-start-[38px]'>
            <Logo />
          </Link>
          <div className='flex flex-col gap-5 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
            {error && (
              <Alert severity='error' onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            <WorkspaceSelection
              workspaces={pendingWorkspaces}
              onSelect={handleWorkspaceSelect}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Login Form View
  // ---------------------------------------------------------------------------
  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
        )}
      >
        <div className='pli-6 max-lg:mbs-40 lg:mbe-24'>
          <img
            src={characterIllustration}
            alt='character-illustration'
            className='max-bs-[673px] max-is-full bs-auto'
          />
        </div>
        <img src={authBackground} className='absolute bottom-[4%] z-[-1] is-full max-md:hidden' />
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <Link className='absolute block-start-5 sm:block-start-[38px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </Link>
        <div className='flex flex-col gap-5 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          <div>
            <Typography variant='h4'>{`Welcome to ${themeConfig.templateName}! 👋🏻`}</Typography>
            <Typography className='mbs-1'>Please sign-in to your account and start the adventure</Typography>
          </div>
          
          {message && (
            <Alert severity='info'>
              {message}
            </Alert>
          )}
          
          {error && (
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form
            noValidate
            autoComplete='off'
            onSubmit={handleSubmit}
            className='flex flex-col gap-5'
          >
            <TextField
              autoFocus
              fullWidth
              label='Email'
              size='small'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            <TextField
              fullWidth
              label='Password'
              size='small'
              type={isPasswordShown ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isSubmitting}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        size='small'
                        edge='end'
                        onClick={handleClickShowPassword}
                        onMouseDown={e => e.preventDefault()}
                      >
                        <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />
            <div className='flex justify-between items-center flex-wrap gap-x-3 gap-y-1'>
              <FormControlLabel control={<Checkbox />} label='Remember me' />
              <Typography className='text-end' color='secondary.main'>
                <Link href='/forgot-password'>Forgot password?</Link>
              </Typography>
            </div>
            <Button
              fullWidth
              variant='contained'
              type='submit'
              disabled={isSubmitting || !email || !password}
            >
              {isSubmitting ? <CircularProgress size={24} color='inherit' /> : 'Log In'}
            </Button>
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>New on our platform?</Typography>
              <Typography component={Link} href='/register' color='primary.main'>
                Create an account
              </Typography>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default LoginV2
