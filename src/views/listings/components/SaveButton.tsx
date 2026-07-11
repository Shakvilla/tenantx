'use client'

interface SaveButtonProps {
  saved: boolean
  onToggle: () => void
  className?: string
}

export default function SaveButton({ saved, onToggle, className = '' }: SaveButtonProps) {
  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onToggle()
  }

  return (
    <button
      onClick={handleClick}
      aria-label={saved ? 'Remove from saved' : 'Save'}
      aria-pressed={saved}
      className={`flex cursor-pointer border-none bg-transparent p-0.5 leading-none ${className}`}
    >
      <svg width='26' height='26' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>
        <path
          d='M16 28l-1.5-1.4C7.4 19.8 3 16 3 11A7 7 0 0116 6.6 7 7 0 0129 11c0 5-4.4 8.8-11.5 15.6z'
          fill='none' stroke='rgba(0,0,0,0.3)' strokeWidth='3'
        />
        <path
          d='M16 28l-1.5-1.4C7.4 19.8 3 16 3 11A7 7 0 0116 6.6 7 7 0 0129 11c0 5-4.4 8.8-11.5 15.6z'
          fill={saved ? '#E53E3E' : 'rgba(255,255,255,0.88)'}
          stroke={saved ? '#E53E3E' : 'rgba(255,255,255,0.9)'} strokeWidth='1.5'
        />
      </svg>
    </button>
  )
}
