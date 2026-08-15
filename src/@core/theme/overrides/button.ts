// MUI Imports
import { darken, getContrastRatio } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'

// Config Imports
import themeConfig from '@configs/themeConfig'

/** WCAG AA for normal-size text. Button labels here are ~15px, so this is the bar. */
const MIN_LABEL_CONTRAST = 4.5

/**
 * A background dark enough for the button's white label to reach WCAG AA.
 *
 * <p>The brand pink (#EF4195) gives white text only 3.58:1 — fine for a chip, an
 * icon or a link underline, short of AA for a 15px button label. Rather than
 * darkening the whole palette and pulling the interface away from the logo, only
 * the filled button is darkened; the brand colour still drives links, chips,
 * highlights and the mark itself.
 *
 * <p>Computed rather than hardcoded because the primary colour is not fixed:
 * platform branding can set a tenant's own colour at runtime, and a hardcoded
 * shade would be wrong for every colour but this one. A palette that already
 * clears the bar is returned untouched, so this is a no-op for dark primaries.
 */
const labelSafeBackground = (theme: {
  palette: { primary: { main: string; contrastText: string } }
}): string => {
  const base = theme.palette.primary.main

  // Only meaningful when MUI has chosen a white label; against a dark label,
  // darkening the background would make things worse.
  if (getContrastRatio(theme.palette.primary.contrastText, '#fff') > 1.05) return base

  for (let step = 0; step <= 10; step++) {
    const candidate = step === 0 ? base : darken(base, step * 0.05)

    if (getContrastRatio('#fff', candidate) >= MIN_LABEL_CONTRAST) return candidate
  }

  return darken(base, 0.5)
}

const iconStyles = (size?: string) => ({
  '& > *:nth-of-type(1)': {
    ...(size === 'small'
      ? {
          fontSize: '14px'
        }
      : {
          ...(size === 'medium'
            ? {
                fontSize: '16px'
              }
            : {
                fontSize: '20px'
              })
        })
  }
})

const button: Theme['components'] = {
  MuiButtonBase: {
    defaultProps: {
      disableRipple: themeConfig.disableRipple
    }
  },
  MuiButton: {
    styleOverrides: {
      root: ({ theme, ownerState }) => ({
        variants: [
          {
            props: { variant: 'text', color: 'primary' },
            style: {
              '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
                {
                  backgroundColor: 'var(--mui-palette-primary-lighterOpacity)'
                },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-primary-main)'
              }
            }
          },
          {
            props: { variant: 'text', color: 'secondary' },
            style: {
              '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
                {
                  backgroundColor: 'var(--mui-palette-secondary-lighterOpacity)'
                },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-secondary-main)'
              }
            }
          },
          {
            props: { variant: 'text', color: 'error' },
            style: {
              '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
                {
                  backgroundColor: 'var(--mui-palette-error-lighterOpacity)'
                },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-error-main)'
              }
            }
          },
          {
            props: { variant: 'text', color: 'warning' },
            style: {
              '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
                {
                  backgroundColor: 'var(--mui-palette-warning-lighterOpacity)'
                },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-warning-main)'
              }
            }
          },
          {
            props: { variant: 'text', color: 'info' },
            style: {
              '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
                {
                  backgroundColor: 'var(--mui-palette-info-lighterOpacity)'
                },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-info-main)'
              }
            }
          },
          {
            props: { variant: 'text', color: 'success' },
            style: {
              '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
                {
                  backgroundColor: 'var(--mui-palette-success-lighterOpacity)'
                },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-success-main)'
              }
            }
          },
          {
            props: { variant: 'outlined', color: 'primary' },
            style: {
              borderColor: 'var(--mui-palette-primary-main)',
              '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
                {
                  backgroundColor: 'var(--mui-palette-primary-lighterOpacity)'
                },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-primary-main)',
                borderColor: 'var(--mui-palette-primary-main)'
              }
            }
          },
          {
            props: { variant: 'outlined', color: 'secondary' },
            style: {
              borderColor: 'var(--mui-palette-secondary-main)',
              '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
                {
                  backgroundColor: 'var(--mui-palette-secondary-lighterOpacity)'
                },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-secondary-main)',
                borderColor: 'var(--mui-palette-secondary-main)'
              }
            }
          },
          {
            props: { variant: 'outlined', color: 'error' },
            style: {
              borderColor: 'var(--mui-palette-error-main)',
              '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
                {
                  backgroundColor: 'var(--mui-palette-error-lighterOpacity)'
                },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-error-main)',
                borderColor: 'var(--mui-palette-error-main)'
              }
            }
          },
          {
            props: { variant: 'outlined', color: 'warning' },
            style: {
              borderColor: 'var(--mui-palette-warning-main)',
              '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
                {
                  backgroundColor: 'var(--mui-palette-warning-lighterOpacity)'
                },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-warning-main)',
                borderColor: 'var(--mui-palette-warning-main)'
              }
            }
          },
          {
            props: { variant: 'outlined', color: 'info' },
            style: {
              borderColor: 'var(--mui-palette-info-main)',
              '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
                {
                  backgroundColor: 'var(--mui-palette-info-lighterOpacity)'
                },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-info-main)',
                borderColor: 'var(--mui-palette-info-main)'
              }
            }
          },
          {
            props: { variant: 'outlined', color: 'success' },
            style: {
              borderColor: 'var(--mui-palette-success-main)',
              '&:not(.Mui-disabled):hover, &:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))':
                {
                  backgroundColor: 'var(--mui-palette-success-lighterOpacity)'
                },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-success-main)',
                borderColor: 'var(--mui-palette-success-main)'
              }
            }
          },
          {
            props: { variant: 'contained', color: 'primary' },
            style: {
              // Not var(--mui-palette-primary-main): see labelSafeBackground above.
              // Hover and active are derived from the same value so they stay
              // darker than the resting state rather than reverting to the
              // lighter palette `dark`.
              backgroundColor: labelSafeBackground(theme),
              '&:not(.Mui-disabled):hover': {
                backgroundColor: darken(labelSafeBackground(theme), 0.1)
              },
              '&:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))': {
                backgroundColor: darken(labelSafeBackground(theme), 0.16)
              },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-primary-contrastText)',
                backgroundColor: labelSafeBackground(theme)
              }
            }
          },
          {
            props: { variant: 'contained', color: 'secondary' },
            style: {
              '&:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))': {
                backgroundColor: 'var(--mui-palette-secondary-dark)'
              },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-secondary-contrastText)',
                backgroundColor: 'var(--mui-palette-secondary-main)'
              }
            }
          },
          {
            props: { variant: 'contained', color: 'error' },
            style: {
              '&:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))': {
                backgroundColor: 'var(--mui-palette-error-dark)'
              },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-error-contrastText)',
                backgroundColor: 'var(--mui-palette-error-main)'
              }
            }
          },
          {
            props: { variant: 'contained', color: 'warning' },
            style: {
              '&:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))': {
                backgroundColor: 'var(--mui-palette-warning-dark)'
              },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-warning-contrastText)',
                backgroundColor: 'var(--mui-palette-warning-main)'
              }
            }
          },
          {
            props: { variant: 'contained', color: 'info' },
            style: {
              '&:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))': {
                backgroundColor: 'var(--mui-palette-info-dark)'
              },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-info-contrastText)',
                backgroundColor: 'var(--mui-palette-info-main)'
              }
            }
          },
          {
            props: { variant: 'contained', color: 'success' },
            style: {
              '&:not(.Mui-disabled):active, &.Mui-focusVisible:not(:has(span.MuiTouchRipple-root))': {
                backgroundColor: 'var(--mui-palette-success-dark)'
              },
              '&.Mui-disabled': {
                color: 'var(--mui-palette-success-contrastText)',
                backgroundColor: 'var(--mui-palette-success-main)'
              }
            }
          }
        ],
        borderRadius: 'var(--mui-shape-customBorderRadius-lg)',
        '&.Mui-disabled': {
          opacity: 0.45
        },
        ...(ownerState.variant === 'text'
          ? {
              ...(ownerState.size === 'small' && {
                padding: theme.spacing(2, 2.25)
              }),
              ...(ownerState.size === 'medium' && {
                padding: theme.spacing(2, 3)
              }),
              ...(ownerState.size === 'large' && {
                padding: theme.spacing(2, 5.5)
              })
            }
          : {
              ...(ownerState.variant === 'outlined'
                ? {
                    ...(ownerState.size === 'small' && {
                      padding: theme.spacing(1.75, 2.75)
                    }),
                    ...(ownerState.size === 'medium' && {
                      padding: theme.spacing(1.75, 5.25)
                    }),
                    ...(ownerState.size === 'large' && {
                      padding: theme.spacing(1.75, 6.25)
                    })
                  }
                : {
                    ...(ownerState.size === 'small' && {
                      padding: theme.spacing(2, 3)
                    }),
                    ...(ownerState.size === 'medium' && {
                      padding: theme.spacing(2, 5.5)
                    }),
                    ...(ownerState.size === 'large' && {
                      padding: theme.spacing(2, 6.5)
                    })
                  })
            })
      }),
      contained: ({ ownerState }) => ({
        boxShadow: 'var(--mui-customShadows-xs)',
        ...(!ownerState.disabled && {
          '&:hover, &.Mui-focusVisible': {
            boxShadow: 'var(--mui-customShadows-xs)'
          },
          '&:active': {
            boxShadow: 'none'
          }
        })
      }),
      sizeSmall: ({ theme }) => ({
        lineHeight: 1.38462,
        fontSize: theme.typography.body2.fontSize,
        borderRadius: 'var(--mui-shape-customBorderRadius-md)'
      }),
      sizeLarge: {
        fontSize: '1.0625rem',
        lineHeight: 1.529412,
        borderRadius: 'var(--mui-shape-customBorderRadius-xl)'
      },
      startIcon: ({ theme, ownerState }) => ({
        ...(ownerState.size === 'small'
          ? {
              marginInlineEnd: theme.spacing(1.5)
            }
          : {
              ...(ownerState.size === 'medium'
                ? {
                    marginInlineEnd: theme.spacing(2)
                  }
                : {
                    marginInlineEnd: theme.spacing(2.5)
                  })
            }),
        ...iconStyles(ownerState.size)
      }),
      endIcon: ({ theme, ownerState }) => ({
        ...(ownerState.size === 'small'
          ? {
              marginInlineStart: theme.spacing(1.5)
            }
          : {
              ...(ownerState.size === 'medium'
                ? {
                    marginInlineStart: theme.spacing(2)
                  }
                : {
                    marginInlineStart: theme.spacing(2.5)
                  })
            }),
        ...iconStyles(ownerState.size)
      })
    }
  }
}

export default button
