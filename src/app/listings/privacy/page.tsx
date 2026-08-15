import type { Metadata } from 'next'
import LegalPageView from '@/views/listings/LegalPageView'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'What personal information we collect on the listings pages and how it is used.',
  robots: { index: false },
}

export default function PrivacyPage() {
  return <LegalPageView doc='privacy' />
}
