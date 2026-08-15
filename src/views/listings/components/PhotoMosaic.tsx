'use client'

import { useState } from 'react'
import Lightbox from './Lightbox'

// ImageKit does not serve original files on this account; see ikUrl.
import { ikUrl, IK_CARD } from '@/lib/imagekit'

interface PhotoMosaicProps {
  images: string[]
  title: string
}

export default function PhotoMosaic({ images, title }: PhotoMosaicProps) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  if (images.length === 0) {
    return (
      <div className='flex h-[380px] flex-col items-center justify-center gap-2.5 rounded-2xl bg-[#F7F7F7] text-[#BBBBBB]'>
        <i className='ri-image-line text-5xl' aria-hidden='true' />
        <span className='text-sm'>No photos available</span>
      </div>
    )
  }

  const tiles = images.slice(1, 5)

  return (
    <>
      <div className='relative overflow-hidden rounded-2xl'>
        {images.length === 1 ? (
          <button
            onClick={() => setLightbox(0)}
            aria-label='Open photo'
            className='block h-[300px] w-full cursor-zoom-in border-none bg-transparent p-0 sm:h-[420px]'
          >
            <img src={ikUrl(images[0], IK_CARD)} alt={title} className='block h-full w-full object-cover' />
          </button>
        ) : (
          <div className='grid h-[300px] grid-cols-1 gap-0.5 sm:h-[420px] sm:grid-cols-2'>
            <button
              onClick={() => setLightbox(0)}
              aria-label='Open photo 1'
              className='block cursor-zoom-in overflow-hidden border-none bg-transparent p-0'
            >
              <img
                src={ikUrl(images[0], IK_CARD)} alt={title}
                className='block h-full w-full object-cover transition-transform duration-300 hover:scale-[1.04]'
              />
            </button>
            <div
              className={`hidden gap-0.5 sm:grid ${
                tiles.length === 1
                  ? 'grid-cols-1 grid-rows-1'
                  : tiles.length === 2
                    ? 'grid-cols-1 grid-rows-2'
                    : 'grid-cols-2 grid-rows-2'
              }`}
            >
              {tiles.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(i + 1)}
                  aria-label={`Open photo ${i + 2}`}
                  className={`block cursor-zoom-in overflow-hidden border-none bg-transparent p-0 ${
                    tiles.length === 3 && i === 0 ? 'row-span-2' : ''
                  }`}
                >
                  <img
                    src={src} alt={`${title} ${i + 2}`}
                    className='block h-full w-full object-cover transition-transform duration-300 hover:scale-[1.05]'
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {images.length > 1 && (
          <button
            onClick={() => setLightbox(0)}
            className='absolute bottom-3.5 right-3.5 flex cursor-pointer items-center gap-1.5 rounded-lg border border-solid border-[#222222] bg-white px-4 py-2 text-[13px] font-semibold text-[#222222] shadow-sm'
          >
            <i className='ri-grid-line' aria-hidden='true' /> Show all photos
          </button>
        )}
      </div>

      {lightbox !== null && (
        <Lightbox
          images={images}
          title={title}
          index={lightbox}
          onIndexChange={setLightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  )
}
