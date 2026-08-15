'use client'

// Third-party Imports
import classnames from 'classnames'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

// Context Imports
import { usePlatformBranding } from '@/contexts/PlatformBrandingContext'

const FooterContent = () => {
  const { platformName } = usePlatformBranding()

  return (
    <div
      className={classnames(verticalLayoutClasses.footerContent, 'flex items-center justify-center flex-wrap gap-4')}
    >
      <p className='text-textSecondary text-sm'>
        {`© ${new Date().getFullYear()} · Powered by `}
        <span className='text-primary font-medium'>{platformName}</span>
      </p>
    </div>
  )
}

export default FooterContent
