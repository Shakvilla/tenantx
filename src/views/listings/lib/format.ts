import type { PublicListingDto } from '@/lib/api/listings-public-client'

export function formatGHS(n: number | null): string {
  if (n == null) return '—'
  return 'GH₵ ' + Number(n).toLocaleString('en-GH', { minimumFractionDigits: 0 })
}

export function bedroomLabel(n: number | null): string | null {
  if (n == null) return null
  if (n === 0) return 'Studio'
  return `${n} bed${n !== 1 ? 's' : ''}`
}

export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function buildWhatsApp(phone: string, title: string): string {
  const cleaned = phone.replace(/\s+/g, '').replace(/^0/, '+233')
  const msg = encodeURIComponent(
    `Hi, I saw your listing for "${title}" and I'm interested. Could you please share more details?`
  )
  return `https://wa.me/${cleaned}?text=${msg}`
}

export function buildMaps(q: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export function buildMapsEmbed(q: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
}

export function matchesSearch(listing: PublicListingDto, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [listing.propertyAddress, listing.propertyName, listing.unitType, listing.title].some(field =>
    (field ?? '').toLowerCase().includes(q)
  )
}
