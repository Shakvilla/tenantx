/*
 * We recommend using the merged theme if you want to override our core theme.
 * This means you can use our core theme and override it with your own customizations.
 * Write your overrides in the userTheme object in this file.
 * The userTheme object is merged with the coreTheme object within this file.
 * Export this file and import it in the `@components/theme/index.tsx` file to use the merged theme.
 */

// MUI Imports
import { deepmerge } from '@mui/utils'
import type { Theme } from '@mui/material/styles'

// Type Imports
import type { Settings } from '@core/contexts/settingsContext'
import type { SystemMode } from '@core/types'

// Core Theme Imports
import coreTheme from '@core/theme'

// Custom Font Families
// Neo Sans Std - for headings and sub-headings
// Proxima Nova Rg - for body text
const headingFontFamily = "'Neo Sans Std', sans-serif"
const bodyFontFamily = "'Proxima Nova Rg', sans-serif"

const mergedTheme = (settings: Settings, mode: SystemMode, direction: Theme['direction']) => {
  // Vars
  const userTheme = {
    // Override typography
    typography: {
      // Default font family (used as fallback)
      fontFamily: bodyFontFamily,

      // Headings use Neo Sans Std
      h1: {
        fontFamily: headingFontFamily,
        fontWeight: 'bold',
      },
      h2: {
        fontFamily: headingFontFamily,
        fontWeight: 'bold',
      },
      h3: {
        fontFamily: headingFontFamily,
        fontWeight: 'bold',
      },
      h4: {
        fontFamily: headingFontFamily,
        fontWeight: 'bold',
      },
      h5: {
        fontFamily: headingFontFamily,
        fontWeight: 'bold',
      },
      h6: {
        fontFamily: headingFontFamily,
        fontWeight: 'bold',
      },

      // Subheadings use Neo Sans Std
      subtitle1: {
        fontFamily: headingFontFamily,
        fontWeight: 'bold',
      },
      subtitle2: {
        fontFamily: headingFontFamily,
        fontWeight: 'bold',
      },

      // Body text uses Proxima Nova Rg
      body1: {
        fontFamily: bodyFontFamily,
      },
      body2: {
        fontFamily: bodyFontFamily,
      },

      // Button text uses Proxima Nova Rg
      button: {
        fontFamily: bodyFontFamily,
      },

      // Caption and overline use Proxima Nova Rg
      caption: {
        fontFamily: bodyFontFamily,
      },
      overline: {
        fontFamily: bodyFontFamily,
      },
    },
  } as Theme

  return deepmerge(coreTheme(settings, mode, direction), userTheme)
}

export default mergedTheme
