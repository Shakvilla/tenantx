'use client'

import { useState } from 'react'
import type { PublicListingDto } from '@/lib/api/listings-public-client'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1'

const inputClass =
  'w-full rounded-lg border border-solid border-[#DDDDDD] bg-white px-3.5 py-3 text-sm text-[#222222] ' +
  'outline-none transition-colors focus:border-[#222222]'

interface InquiryFormProps {
  listing: PublicListingDto
  primaryColour: string
}

export default function InquiryForm({ listing, primaryColour }: InquiryFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(
    `Hi, I'm interested in "${listing.title}" and would like to arrange a viewing.`
  )
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const body = [
        `Name: ${name}`,
        `Phone: ${phone}`,
        email && `Email: ${email}`,
        '',
        message,
        '',
        `Listing: ${listing.title} (${listing.id})`,
      ]
        .filter(Boolean)
        .join('\n')
      await fetch(`${API_BASE}/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: `listing-${listing.id}`,
          submitterEmail: email || `${phone}@inquiry`,
          subject: `Viewing request: ${listing.title}`,
          body,
          priority: 'MEDIUM',
        }),
      })
      setSuccess(true)
    } catch {
      setError('Could not send your message. Please call or WhatsApp directly.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className='px-4 py-8 text-center'>
        <div className='mx-auto mb-3 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#F0FBF0]'>
          <i className='ri-checkbox-circle-line text-3xl text-[#0A7B34]' aria-hidden='true' />
        </div>
        <div className='mb-1.5 text-base font-bold text-[#222222]'>Message sent!</div>
        <div className='text-[13px] text-[#717171]'>The property manager will contact you shortly.</div>
      </div>
    )
  }

  const canSubmit = !loading && name.trim() !== '' && phone.trim() !== ''

  return (
    <form onSubmit={submit} className='flex flex-col gap-2.5'>
      {error && (
        <div className='rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-[13px] text-[#B91C1C]'>
          {error}
        </div>
      )}
      <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2'>
        <input className={inputClass} placeholder='Your name *' value={name} onChange={e => setName(e.target.value)} required />
        <input className={inputClass} placeholder='Phone number *' type='tel' value={phone} onChange={e => setPhone(e.target.value)} required />
      </div>
      <input className={inputClass} placeholder='Email (optional)' type='email' value={email} onChange={e => setEmail(e.target.value)} />
      <textarea
        className={`${inputClass} min-h-[100px] resize-y`}
        value={message}
        onChange={e => setMessage(e.target.value)}
        required
        aria-label='Message to the property manager'
      />
      <button
        type='submit'
        disabled={!canSubmit}
        className={`rounded-lg border-none py-3.5 text-[15px] font-semibold text-white ${
          canSubmit ? 'cursor-pointer' : 'cursor-default'
        }`}
        style={{ background: canSubmit ? primaryColour : '#D1D5DB' }}
      >
        {loading ? 'Sending…' : 'Request a viewing'}
      </button>
      <p className='text-center text-xs text-[#717171]'>You won't be charged anything</p>
    </form>
  )
}
