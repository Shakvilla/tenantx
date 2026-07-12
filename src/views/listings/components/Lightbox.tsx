'use client'

import { useEffect, useRef } from 'react'

interface LightboxProps {
  images: string[]
  title: string
  index: number
  onIndexChange: (i: number) => void
  onClose: () => void
}

export default function Lightbox({ images, title, index, onIndexChange, onClose }: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector<HTMLElement>('button')?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      previouslyFocused?.focus()
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onIndexChange(index === 0 ? images.length - 1 : index - 1)
      if (e.key === 'ArrowRight') onIndexChange(index === images.length - 1 ? 0 : index + 1)
      if (e.key === 'Tab') {
        const dialog = dialogRef.current
        if (!dialog) return
        const focusables = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        const active = document.activeElement
        if (e.shiftKey && (active === first || !dialog.contains(active))) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, images.length, onClose, onIndexChange])

  const navBtn =
    'flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-none bg-white/10 text-2xl text-white hover:bg-white/20'

  return (
    <div
      ref={dialogRef}
      role='dialog'
      aria-modal='true'
      aria-label={`Photos of ${title}`}
      onClick={onClose}
      className='fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95'
    >
      <button
        onClick={onClose}
        aria-label='Close photos'
        className='absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-none bg-white/10 text-lg text-white hover:bg-white/20'
      >
        ✕
      </button>
      <span
        onClick={e => e.stopPropagation()}
        className='absolute top-5 left-1/2 -translate-x-1/2 text-[13px] text-white/60'
      >
        {index + 1} / {images.length}
      </span>

      <div className='flex w-full items-center justify-center gap-3 px-4' onClick={e => e.stopPropagation()}>
        <button onClick={() => onIndexChange(index === 0 ? images.length - 1 : index - 1)} aria-label='Previous photo' className={navBtn}>
          ‹
        </button>
        <img
          src={images[index]}
          alt={`${title} — photo ${index + 1}`}
          className='max-h-[72vh] max-w-[80vw] rounded-lg object-contain'
        />
        <button onClick={() => onIndexChange(index === images.length - 1 ? 0 : index + 1)} aria-label='Next photo' className={navBtn}>
          ›
        </button>
      </div>

      {/* Thumbnail filmstrip */}
      <div
        className='absolute bottom-4 left-0 right-0 overflow-x-auto px-4 py-1'
        onClick={e => e.stopPropagation()}
      >
        {/* w-max + mx-auto centers the strip when it fits and keeps every thumbnail scroll-reachable when it overflows */}
        <div className='mx-auto flex w-max gap-2'>
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => onIndexChange(i)}
              aria-label={`Go to photo ${i + 1}`}
              className={`h-14 w-20 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 border-solid bg-transparent p-0 transition-opacity ${
                i === index ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              <img src={src} alt='' aria-hidden='true' className='h-full w-full object-cover' />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
