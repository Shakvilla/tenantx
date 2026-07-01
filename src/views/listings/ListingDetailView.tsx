'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { usePlatformBranding } from '@/contexts/PlatformBrandingContext'

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatGHS(n: number | null) {
  if (n == null) return '—'
  return 'GH₵ ' + Number(n).toLocaleString('en-GH', { minimumFractionDigits: 0 })
}

function formatDate(iso: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' })
}

function buildWhatsApp(phone: string, title: string) {
  const cleaned = phone.replace(/\s+/g, '').replace(/^0/, '+233')
  const msg = encodeURIComponent(`Hi, I saw your listing for "${title}" and I'm interested. Could you please share more details?`)
  return `https://wa.me/${cleaned}?text=${msg}`
}

function buildMaps(q: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

// ─── Amenity icon map ────────────────────────────────────────────────────────

const AMENITY_ICONS: Record<string, string> = {
  wifi: 'ri-wifi-line', parking: 'ri-parking-box-line', pool: 'ri-drop-line',
  gym: 'ri-run-line', security: 'ri-shield-check-line', generator: 'ri-flashlight-line',
  water: 'ri-water-flash-line', ac: 'ri-temp-cold-line', furnished: 'ri-sofa-line',
  balcony: 'ri-building-line', kitchen: 'ri-restaurant-line', laundry: 'ri-t-shirt-line',
}

function amenityIcon(name: string): string {
  const key = name.toLowerCase()
  for (const [k, v] of Object.entries(AMENITY_ICONS)) {
    if (key.includes(k)) return v
  }
  return 'ri-checkbox-circle-line'
}

// ─── Photo grid ──────────────────────────────────────────────────────────────

function PhotoGrid({ images, title }: { images: string[]; title: string }) {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const prev = useCallback(() => setLightbox(i => (i === null || i === 0) ? images.length - 1 : i - 1), [images.length])
  const next = useCallback(() => setLightbox(i => (i === null || i === images.length - 1) ? 0 : i + 1), [images.length])

  if (!images.length) {
    return (
      <div style={{ height: 380, background: '#F7F7F7', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#BBBBBB', gap: 10 }}>
        <i className='ri-image-line' style={{ fontSize: '3rem' }} />
        <span style={{ fontSize: 14 }}>No photos available</span>
      </div>
    )
  }

  return (
    <>
      <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
        {images.length === 1 ? (
          <div style={{ height: 400, cursor: 'zoom-in' }} onClick={() => setLightbox(0)}>
            <img src={images[0]} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, height: 400 }}>
            <div onClick={() => setLightbox(0)} style={{ cursor: 'zoom-in', overflow: 'hidden', gridRow: '1 / 3' }}>
              <img src={images[0]} alt={title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.35s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: images.slice(1, 5).length > 2 ? '1fr 1fr' : '1fr', gridTemplateRows: '1fr 1fr', gap: 3, height: 400 }}>
              {images.slice(1, 5).map((src, i) => (
                <div key={i} onClick={() => setLightbox(i + 1)} style={{ cursor: 'zoom-in', overflow: 'hidden' }}>
                  <img src={src} alt={`${title} ${i + 2}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.35s' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
                </div>
              ))}
            </div>
          </div>
        )}

        {images.length > 1 && (
          <button
            onClick={() => setLightbox(0)}
            style={{ position: 'absolute', bottom: 14, right: 14, background: '#fff', border: '1px solid #222', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', color: '#222', boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}
          >
            <i className='ri-grid-line' /> Show all photos
          </button>
        )}
      </div>

      {lightbox !== null && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setLightbox(null)} style={{ position: 'absolute', top: 18, right: 18, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          <span style={{ position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{lightbox + 1} / {images.length}</span>
          <button onClick={e => { e.stopPropagation(); prev() }} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', color: '#fff', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <img src={images[lightbox]} alt={`${title} ${lightbox + 1}`} onClick={e => e.stopPropagation()} style={{ maxWidth: '85vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={e => { e.stopPropagation(); next() }} style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 44, height: 44, cursor: 'pointer', color: '#fff', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        </div>
      )}
    </>
  )
}

// ─── Highlights strip ────────────────────────────────────────────────────────

function Highlights({ listing }: { listing: PublicListingDto }) {
  const items: { icon: string; title: string; sub: string }[] = []

  if (listing.availableFrom) items.push({ icon: 'ri-calendar-check-line', title: `Available ${formatDate(listing.availableFrom)}`, sub: 'Secure your move-in date today' })
  if (listing.bedrooms === 0) items.push({ icon: 'ri-home-2-line', title: 'Studio apartment', sub: 'Efficient open-plan living' })
  else if (listing.bedrooms != null) items.push({ icon: 'ri-hotel-bed-line', title: `${listing.bedrooms}-bedroom ${listing.unitType.toLowerCase()}`, sub: 'Fully private bedrooms' })
  if (listing.amenities.length >= 3) items.push({ icon: 'ri-star-line', title: `${listing.amenities.length} amenities included`, sub: listing.amenities.slice(0, 2).join(', ') + ' & more' })
  if (listing.contactPhone) items.push({ icon: 'ri-shield-check-line', title: 'Verified property manager', sub: 'Identity and licence confirmed' })

  if (!items.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {items.slice(0, 3).map((h, i) => (
        <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '18px 0', borderBottom: i < Math.min(items.length, 3) - 1 ? '1px solid #EBEBEB' : 'none' }}>
          <i className={h.icon} style={{ fontSize: '1.6rem', color: '#222', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>{h.title}</div>
            <div style={{ fontSize: 13, color: '#717171', marginTop: 2 }}>{h.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Inquiry form ────────────────────────────────────────────────────────────

function InquiryForm({ listing, primaryColour }: { listing: PublicListingDto; primaryColour: string }) {
  const [name, setName]       = useState('')
  const [phone, setPhone]     = useState('')
  const [email, setEmail]     = useState('')
  const [message, setMessage] = useState(`Hi, I'm interested in "${listing.title}" and would like to arrange a viewing.`)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1'

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 14px', border: '1px solid #DDDDDD',
    borderRadius: 8, fontSize: 14, fontFamily: 'inherit', color: '#222',
    background: '#fff', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError(null)
    try {
      const body = [`Name: ${name}`, `Phone: ${phone}`, email && `Email: ${email}`, '', message, '', `Listing: ${listing.title} (${listing.id})`].filter(Boolean).join('\n')
      await fetch(`${API_BASE}/support/tickets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: `listing-${listing.id}`, submitterEmail: email || `${phone}@inquiry`, subject: `Viewing request: ${listing.title}`, body, priority: 'MEDIUM' }),
      })
      setSuccess(true)
    } catch { setError('Could not send your message. Please call or WhatsApp directly.') }
    finally { setLoading(false) }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center', padding: '32px 16px' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#F0FBF0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <i className='ri-checkbox-circle-line' style={{ fontSize: '1.7rem', color: '#0A7B34' }} />
        </div>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#222', marginBottom: 6 }}>Message sent!</div>
        <div style={{ fontSize: 13, color: '#717171' }}>The property manager will contact you shortly.</div>
      </div>
    )
  }

  const canSubmit = !loading && name.trim() && phone.trim()

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#B91C1C' }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input style={inp} placeholder='Your name *' value={name} onChange={e => setName(e.target.value)} required
          onFocus={e => (e.target.style.borderColor = '#222')} onBlur={e => (e.target.style.borderColor = '#DDDDDD')} />
        <input style={inp} placeholder='Phone number *' type='tel' value={phone} onChange={e => setPhone(e.target.value)} required
          onFocus={e => (e.target.style.borderColor = '#222')} onBlur={e => (e.target.style.borderColor = '#DDDDDD')} />
      </div>
      <input style={inp} placeholder='Email (optional)' type='email' value={email} onChange={e => setEmail(e.target.value)}
        onFocus={e => (e.target.style.borderColor = '#222')} onBlur={e => (e.target.style.borderColor = '#DDDDDD')} />
      <textarea style={{ ...inp, minHeight: 100, resize: 'vertical' }} value={message} onChange={e => setMessage(e.target.value)} required
        onFocus={e => (e.target.style.borderColor = '#222')} onBlur={e => (e.target.style.borderColor = '#DDDDDD')} />
      <button type='submit' disabled={!canSubmit} style={{
        padding: '14px', borderRadius: 8, border: 'none',
        background: canSubmit ? primaryColour : '#D1D5DB',
        color: '#fff', fontWeight: 600, fontSize: 15,
        cursor: canSubmit ? 'pointer' : 'default', fontFamily: 'inherit',
        transition: 'opacity 0.15s', letterSpacing: '0.01em',
      }}>
        {loading ? 'Sending…' : 'Request a viewing'}
      </button>
      <p style={{ fontSize: 12, color: '#717171', textAlign: 'center', margin: 0 }}>You won't be charged anything</p>
    </form>
  )
}

// ─── Reserve card (sidebar) ──────────────────────────────────────────────────

function ReserveCard({ listing, primaryColour, platformName }: { listing: PublicListingDto; primaryColour: string; platformName: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  const outlineBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', padding: '13px', borderRadius: 8,
    border: '1px solid #DDDDDD', background: '#fff', color: '#222',
    fontSize: 14, fontWeight: 500, cursor: 'pointer', textDecoration: 'none',
    fontFamily: 'inherit', transition: 'border-color 0.15s',
  }

  return (
    <div style={{ border: '1px solid #DDDDDD', borderRadius: 16, padding: 24, boxShadow: '0 6px 20px rgba(0,0,0,0.10)', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Price */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: '#222' }}>{formatGHS(listing.rent)}</span>
        <span style={{ fontSize: 14, color: '#717171', paddingBottom: 3 }}>/ month</span>
      </div>

      {/* Availability pill */}
      {listing.availableFrom && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F0FBF0', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#0A7B34' }}>
          <i className='ri-calendar-check-line' />
          Available {formatDate(listing.availableFrom)}
        </div>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid #EBEBEB', margin: 0 }} />

      {/* WhatsApp CTA */}
      {listing.contactPhone && (
        <a href={buildWhatsApp(listing.contactPhone, listing.title)} target='_blank' rel='noopener noreferrer'
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: 8, border: 'none', background: '#25D366', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit', letterSpacing: '0.01em' }}>
          <svg width='18' height='18' viewBox='0 0 24 24' fill='white'>
            <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z'/>
            <path d='M12 0C5.373 0 0 5.373 0 12c0 2.124.554 4.121 1.524 5.855L.057 23.882l6.165-1.616A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.014-1.378l-.359-.214-3.721.976.993-3.624-.234-.372A9.818 9.818 0 1112 21.818z'/>
          </svg>
          WhatsApp agent
        </a>
      )}

      {/* Request viewing — brand colour */}
      <a href='#request-viewing' onClick={e => { e.preventDefault(); document.getElementById('request-viewing')?.scrollIntoView({ behavior: 'smooth' }) }}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px', borderRadius: 8, border: 'none', background: primaryColour, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit', letterSpacing: '0.01em' }}>
        Request a viewing
      </a>

      <p style={{ fontSize: 12, color: '#717171', textAlign: 'center', margin: 0 }}>You won't be charged anything</p>

      <hr style={{ border: 'none', borderTop: '1px solid #EBEBEB', margin: 0 }} />

      {listing.contactPhone && (
        <a href={`tel:${listing.contactPhone}`} style={{ ...outlineBtn, textDecoration: 'none' }}>
          <i className='ri-phone-line' style={{ fontSize: '1rem' }} /> Call agent
        </a>
      )}
      {listing.contactEmail && (
        <a href={`mailto:${listing.contactEmail}?subject=${encodeURIComponent('Enquiry: ' + listing.title)}`} style={{ ...outlineBtn, textDecoration: 'none' }}>
          <i className='ri-mail-line' style={{ fontSize: '1rem' }} /> Email agent
        </a>
      )}

      <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: copied ? '#0A7B34' : '#717171', fontFamily: 'inherit', textDecoration: 'underline', padding: '4px 0' }}>
        <i className={copied ? 'ri-check-line' : 'ri-link'} style={{ marginRight: 4 }} />
        {copied ? 'Link copied!' : 'Copy listing link'}
      </button>

      {/* Agent badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
        <div style={{ width: 42, height: 42, borderRadius: '50%', background: primaryColour, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem', color: '#fff', fontWeight: 700 }}>
          {listing.propertyName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#222' }}>{listing.propertyName}</div>
          <div style={{ fontSize: 12, color: '#717171', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <i className='ri-shield-check-fill' style={{ color: '#0A7B34', fontSize: '0.9rem' }} /> Verified manager
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function ListingDetailView({ listing }: { listing: PublicListingDto }) {
  const { platformName, logoUrl, primaryColour } = usePlatformBranding()
  const [descExpanded, setDescExpanded]         = useState(false)
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false)

  const isInactive = listing.status !== 'ACTIVE'

  const descWords = (listing.description ?? '').split(' ')
  const longDesc  = descWords.length > 60
  const visibleDesc = (!longDesc || descExpanded) ? listing.description : descWords.slice(0, 60).join(' ') + '…'

  const visibleAmenities = amenitiesExpanded ? listing.amenities : listing.amenities.slice(0, 8)

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>

      {/* ── Header ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: '#fff', borderBottom: '1px solid #EBEBEB' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href='/listings' style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#222', textDecoration: 'none', fontWeight: 500 }}>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M19 12H5M5 12l7-7M5 12l7 7'/>
            </svg>
            Back to listings
          </Link>

          {/* Platform logo / name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {logoUrl ? (
              <img src={logoUrl} alt={platformName} style={{ height: 32, objectFit: 'contain' }} />
            ) : (
              <>
                <svg width='24' height='24' viewBox='0 0 32 32' fill={primaryColour}>
                  <path d='M16 1C10.5 1 6 5.9 6 12c0 4.3 2.3 8.6 5 11.5L16 29l5-5.5c2.7-2.9 5-7.2 5-11.5C26 5.9 21.5 1 16 1zm0 15a4 4 0 110-8 4 4 0 010 8z'/>
                </svg>
                <span style={{ fontWeight: 800, fontSize: 16, color: primaryColour, letterSpacing: '-0.5px' }}>{platformName}</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Inactive banner ── */}
      {isInactive && (
        <div style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA', padding: '12px 24px', fontSize: 13, color: '#B91C1C', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
          <i className='ri-error-warning-line' style={{ fontSize: '1.1rem' }} />
          This unit is no longer available for rent.
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px' }}>

        {/* Title + meta */}
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#222', margin: '0 0 6px', lineHeight: 1.25 }}>
          {listing.title}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#717171', marginBottom: 20, flexWrap: 'wrap' }}>
          <i className='ri-map-pin-2-line' style={{ color: primaryColour }} />
          <span>{listing.propertyAddress}</span>
          <span>·</span>
          <span>{listing.unitType}</span>
          <span>·</span>
          <span style={{ background: isInactive ? '#FEF2F2' : '#F0FBF0', color: isInactive ? '#B91C1C' : '#0A7B34', padding: '2px 10px', borderRadius: 40, fontSize: 12, fontWeight: 600 }}>
            {isInactive ? 'Unavailable' : 'Available'}
          </span>
        </div>

        {/* Photos */}
        <PhotoGrid images={listing.images} title={listing.title} />

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 52, marginTop: 36, alignItems: 'start' }}>

          {/* ── Left ── */}
          <div>
            {/* Host strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 24, borderBottom: '1px solid #EBEBEB' }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#222' }}>
                  {listing.unitType} offered by {listing.propertyName}
                </div>
                <div style={{ fontSize: 14, color: '#717171', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {listing.bedrooms != null && <span>{listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bedroom${listing.bedrooms !== 1 ? 's' : ''}`}</span>}
                  {listing.bathrooms != null && <><span>·</span><span>{listing.bathrooms} bathroom{listing.bathrooms !== 1 ? 's' : ''}</span></>}
                  {listing.sizeSqft != null && <><span>·</span><span>{Number(listing.sizeSqft).toLocaleString()} sqft</span></>}
                </div>
              </div>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: primaryColour, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.3rem', color: '#fff', fontWeight: 800 }}>
                {listing.propertyName.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Highlights */}
            <div style={{ padding: '24px 0', borderBottom: '1px solid #EBEBEB' }}>
              <Highlights listing={listing} />
            </div>

            {/* Description */}
            {listing.description && (
              <div style={{ padding: '24px 0', borderBottom: '1px solid #EBEBEB' }}>
                <p style={{ fontSize: 15, color: '#222', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>{visibleDesc}</p>
                {longDesc && (
                  <button onClick={() => setDescExpanded(e => !e)} style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#222', fontFamily: 'inherit', textDecoration: 'underline', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {descExpanded ? 'Show less' : 'Show more'} <i className={descExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
                  </button>
                )}
              </div>
            )}

            {/* Amenities */}
            {listing.amenities.length > 0 && (
              <div style={{ padding: '24px 0', borderBottom: '1px solid #EBEBEB' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#222', margin: '0 0 18px' }}>What this place offers</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
                  {visibleAmenities.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#222' }}>
                      <i className={amenityIcon(a)} style={{ fontSize: '1.25rem', color: '#222', flexShrink: 0 }} />
                      {a}
                    </div>
                  ))}
                </div>
                {listing.amenities.length > 8 && (
                  <button onClick={() => setAmenitiesExpanded(e => !e)} style={{ marginTop: 18, padding: '10px 20px', border: '1px solid #222', borderRadius: 8, background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#222' }}>
                    {amenitiesExpanded ? 'Show fewer amenities' : `Show all ${listing.amenities.length} amenities`}
                  </button>
                )}
              </div>
            )}

            {/* Location */}
            <div style={{ padding: '24px 0', borderBottom: '1px solid #EBEBEB' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#222', margin: '0 0 14px' }}>Where you'll be</h2>
              <div style={{ background: '#F7F7F7', borderRadius: 12, padding: '20px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <i className='ri-map-pin-2-fill' style={{ fontSize: '1.8rem', color: primaryColour, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#222' }}>{listing.propertyName}</div>
                    <div style={{ fontSize: 13, color: '#717171', marginTop: 2 }}>{listing.propertyAddress}</div>
                  </div>
                </div>
                <a href={buildMaps(`${listing.propertyName}, ${listing.propertyAddress}`)} target='_blank' rel='noopener noreferrer'
                  style={{ flexShrink: 0, padding: '9px 18px', border: '1px solid #222', borderRadius: 8, color: '#222', fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className='ri-external-link-line' /> Open in Maps
                </a>
              </div>
            </div>

            {/* Inquiry form */}
            {!isInactive && (
              <div id='request-viewing' style={{ padding: '24px 0' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#222', margin: '0 0 6px' }}>Request a viewing</h2>
                <p style={{ fontSize: 14, color: '#717171', margin: '0 0 20px' }}>Fill in your details and the property manager will reach out to schedule a visit.</p>
                <InquiryForm listing={listing} primaryColour={primaryColour} />
              </div>
            )}
          </div>

          {/* ── Right (sticky) ── */}
          <div style={{ position: 'sticky', top: 88 }}>
            {isInactive ? (
              <div style={{ border: '1px solid #DDDDDD', borderRadius: 16, padding: 28, textAlign: 'center', color: '#AAAAAA', boxShadow: '0 6px 20px rgba(0,0,0,0.07)' }}>
                <i className='ri-home-line' style={{ fontSize: '2.5rem', display: 'block', marginBottom: 10, color: '#E0E0E0' }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: '#717171', marginBottom: 6 }}>Unit unavailable</div>
                <div style={{ fontSize: 13, marginBottom: 20 }}>This listing has been deactivated.</div>
                <Link href='/listings' style={{ display: 'inline-block', padding: '10px 22px', borderRadius: 8, background: '#222', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  Browse other listings
                </Link>
              </div>
            ) : (
              <ReserveCard listing={listing} primaryColour={primaryColour} platformName={platformName} />
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid #EBEBEB', background: '#F7F7F7', padding: '20px 24px', marginTop: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: 12, color: '#717171' }}>
          <span>© 2025 {platformName} · Ghana Property Platform</span>
          <span style={{ color: '#BBBBBB' }}>Listing #{listing.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </footer>
    </div>
  )
}
