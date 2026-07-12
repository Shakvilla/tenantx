'use client'

interface SearchPillProps {
  value: string
  onChange: (v: string) => void
  brandColour: string
}

export default function SearchPill({ value, onChange, brandColour }: SearchPillProps) {
  return (
    <div
      className='flex w-full items-center gap-2 rounded-full border border-[#DDDDDD] bg-white py-1.5 pl-5 pr-1.5
                 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)] transition-shadow
                 focus-within:shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.14)]'
    >
      <i className='ri-map-pin-2-line shrink-0 text-[#717171]' aria-hidden='true' />
      <input
        type='search'
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder='Search by area, city or property'
        aria-label='Search listings by location or property name'
        className='w-full border-none bg-transparent text-sm text-[#222222] outline-none [&::-webkit-search-cancel-button]:hidden'
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label='Clear search'
          className='flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-[#F0F0F0] text-[#717171] hover:bg-[#DDDDDD]'
        >
          <i className='ri-close-line text-sm' aria-hidden='true' />
        </button>
      )}
      <span
        aria-hidden='true'
        className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white'
        style={{ background: brandColour }}
      >
        <i className='ri-search-line text-sm' />
      </span>
    </div>
  )
}
