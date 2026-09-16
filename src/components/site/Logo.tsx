import { useState } from 'react'

interface LogoProps {
  markOnly?: boolean
  className?: string
}

export function Logo({ markOnly = false, className = '' }: LogoProps) {
  const [imgFailed, setImgFailed] = useState(false)

  // Falls back to a text lockup if the real asset ever fails to load.
  if (imgFailed) {
    return (
      <span className={`inline-flex items-center text-display font-bold tracking-tight ${className}`}>
        <span className="text-brand">f</span>
        {!markOnly && <span className="text-ink">lip</span>}
      </span>
    )
  }

  return (
    <img
      src={markOnly ? '/flip-mark.png' : '/flip-logo.png'}
      alt="Flip"
      className={`h-24 w-auto ${className}`}
      onError={() => setImgFailed(true)}
    />
  )
}
