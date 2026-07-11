'use client'

import { useRef, useState } from 'react'

interface PhotoCarouselProps {
  images: string[]
  alt: string
}

export default function PhotoCarousel({ images, alt }: PhotoCarouselProps) {
  const [idx, setIdx] = useState(0)
  const pointerStartX = useRef<number | null>(null)

  if (images.length === 0) {
    return (
      <div className='flex h-full w-full flex-col items-center justify-center gap-1.5 text-[#C0C0C0]'>
        <i className='ri-image-line text-3xl' aria-hidden='true' />
        <span className='text-xs'>No photo</span>
      </div>
    )
  }

  function prev(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setIdx(i => Math.max(0, i - 1))
  }
  function next(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setIdx(i => Math.min(images.length - 1, i + 1))
  }

  function onPointerDown(e: React.PointerEvent) {
    pointerStartX.current = e.clientX
  }
  function onPointerUp(e: React.PointerEvent) {
    if (pointerStartX.current == null) return
    const dx = e.clientX - pointerStartX.current
    pointerStartX.current = null
    if (Math.abs(dx) < 40) return
    e.preventDefault()
    setIdx(i => (dx < 0 ? Math.min(images.length - 1, i + 1) : Math.max(0, i - 1)))
  }

  const arrowClass =
    'absolute top-1/2 z-[3] flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center ' +
    'rounded-full border-none bg-white/95 shadow-md opacity-0 transition-opacity group-hover/card:opacity-100'

  return (
    <div className='relative h-full w-full touch-pan-y' onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <img
        src={images[idx]} alt={alt} loading='lazy' draggable={false}
        className='block h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105'
      />
      {images.length > 1 && (
        <>
          {idx > 0 && (
            <button onClick={prev} aria-label='Previous photo' className={`${arrowClass} left-2.5`}>
              <i className='ri-arrow-left-s-line text-base text-[#222222]' aria-hidden='true' />
            </button>
          )}
          {idx < images.length - 1 && (
            <button onClick={next} aria-label='Next photo' className={`${arrowClass} right-2.5`}>
              <i className='ri-arrow-right-s-line text-base text-[#222222]' aria-hidden='true' />
            </button>
          )}
          <div className='absolute bottom-2.5 left-0 right-0 z-[2] flex justify-center gap-1' aria-hidden='true'>
            {images.slice(0, 5).map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all duration-150 ${
                  i === idx ? 'h-1.5 w-1.5 bg-white' : 'h-[5px] w-[5px] bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
