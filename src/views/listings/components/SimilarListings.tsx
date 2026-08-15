'use client'

import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { findSimilarListings } from '../lib/similar'
import ListingCard from './ListingCard'

interface SimilarListingsProps {
  all: PublicListingDto[]
  current: PublicListingDto
  isSaved: (id: string) => boolean
  onToggleSave: (id: string) => void
}

export default function SimilarListings({ all, current, isSaved, onToggleSave }: SimilarListingsProps) {
  const matches = findSimilarListings(all, current)
  if (matches.length === 0) return null

  return (
    <section className='border-t border-[#EBEBEB] py-10'>
      <h2 className='mb-6 text-xl font-bold text-[#222222]'>More homes you might like</h2>
      {/* Horizontal scroll on mobile, 4-col grid from lg */}
      <div className='grid auto-cols-[75%] grid-flow-col gap-4 overflow-x-auto pb-2 sm:auto-cols-[45%] lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:pb-0'>
        {matches.map(l => (
          <ListingCard key={l.id} listing={l} saved={isSaved(l.id)} onToggleSave={() => onToggleSave(l.id)} />
        ))}
      </div>
    </section>
  )
}
