'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { Mode } from '@core/types'

// Component Imports
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'
import { useAuth } from '@/contexts/AuthContext'

const Register = ({ mode }: { mode: Mode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    tenantName: '',
    phone: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Vars
  const darkImg = '/images/pages/auth-v2-mask-1-dark.png'
  const lightImg = '/images/pages/auth-v2-mask-1-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-register-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-register-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-register-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-register-light-border.png'

  // Hooks
  const router = useRouter()
  const { settings } = useSettings()
  const { register } = useAuth()
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsSubmitting(true)

    const result = await register({
      email: formData.email,
      password: formData.password,
      name: formData.name,
      phone: formData.phone || undefined,
      tenantName: formData.tenantName,
    })

    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error || 'Registration failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  const isFormValid =
    formData.name &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.tenantName

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
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[520px]'>
        <Link className='absolute block-start-5 sm:block-start-[38px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </Link>
        <div className='flex flex-col gap-5 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          <div>
            <Typography variant='h4'>{`Join ${themeConfig.templateName}! 🚀`}</Typography>
            <Typography className='mbs-1'>Create your account and start managing your properties</Typography>
          </div>

          {error && (
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form
            noValidate
            autoComplete='off'
            onSubmit={handleSubmit}
            className='flex flex-col gap-4'
          >
            <TextField
              autoFocus
              fullWidth
              label='Full Name'
              size='small'
              value={formData.name}
              onChange={handleChange('name')}
              disabled={isSubmitting}
              required
            />
            <TextField
              fullWidth
              label='Email'
              size='small'
              type='email'
              value={formData.email}
              onChange={handleChange('email')}
              disabled={isSubmitting}
              required
            />
            <TextField
              fullWidth
              label='Phone (optional)'
              size='small'
              type='tel'
              value={formData.phone}
              onChange={handleChange('phone')}
              disabled={isSubmitting}
            />
            <TextField
              fullWidth
              label='Company / Organization Name'
              size='small'
              value={formData.tenantName}
              onChange={handleChange('tenantName')}
              disabled={isSubmitting}
              required
              helperText='This will be your workspace name'
            />
            <TextField
              fullWidth
              label='Password'
              size='small'
              type={isPasswordShown ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange('password')}
              disabled={isSubmitting}
              required
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
            <TextField
              fullWidth
              label='Confirm Password'
              size='small'
              type={isPasswordShown ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              disabled={isSubmitting}
              required
            />
            <Button
              fullWidth
              variant='contained'
              type='submit'
              disabled={isSubmitting || !isFormValid}
              className='mt-2'
            >
              {isSubmitting ? <CircularProgress size={24} color='inherit' /> : 'Create Account'}
            </Button>
            <div className='flex justify-center items-center flex-wrap gap-2'>
              <Typography>Already have an account?</Typography>
              <Typography component={Link} href='/login' color='primary.main'>
                Sign in instead
              </Typography>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register
