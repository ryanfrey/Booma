import { useState } from 'react'

interface LogoProps {
  markOnly?: boolean
  size?: 'sm' | 'lg'
  className?: string
}

const HEIGHT_CLASS: Record<'sm' | 'lg', string> = {
  sm: 'h-9',
  lg: 'h-24',
}

const TEXT_SIZE_CLASS: Record<'sm' | 'lg', string> = {
  sm: 'text-h3',
  lg: 'text-display',
}

export function Logo({ markOnly = false, size = 'lg', className = '' }: LogoProps) {
  const [imgFailed, setImgFailed] = useState(false)

  // Falls back to a text lockup if the real asset ever fails to load.
  if (imgFailed) {
    return (
      <span className={`inline-flex items-center ${TEXT_SIZE_CLASS[size]} font-bold tracking-tight ${className}`}>
        <span className="text-brand">f</span>
        {!markOnly && <span className="text-ink">lip</span>}
      </span>
    )
  }

  return (
    <img
      src={markOnly ? '/flip-mark.png' : '/flip-logo.png'}
      alt="Flip"
      className={`${HEIGHT_CLASS[size]} w-auto ${className}`}
      onError={() => setImgFailed(true)}
    />
  )
}
