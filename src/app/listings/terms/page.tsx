import type { Metadata } from 'next'
import LegalPageView from '@/views/listings/LegalPageView'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that govern browsing rental listings and requesting viewings.',
  robots: { index: false },
}

export default function TermsPage() {
  return <LegalPageView doc='terms' />
}
