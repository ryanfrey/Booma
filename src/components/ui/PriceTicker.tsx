import { useEffect, useRef, useState } from 'react'
import { formatZARWhole } from '../../lib/currency'

// Short count-up + brief teal flash on change, no bounce, respects reduced motion.
export function PriceTicker({ amount, className = '' }: { amount: number; className?: string }) {
  const [display, setDisplay] = useState(amount)
  const [flash, setFlash] = useState(false)
  const prevRef = useRef(amount)

  useEffect(() => {
    const prev = prevRef.current
    if (amount === prev) return
    prevRef.current = amount

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setFlash(true)
    const flashTimeout = setTimeout(() => setFlash(false), 280)

    if (reduceMotion) {
      setDisplay(amount)
      return () => clearTimeout(flashTimeout)
    }

    const duration = 250
    const start = performance.now()
    let raf: number

    const tick = (time: number) => {
      const progress = Math.min(1, (time - start) / duration)
      setDisplay(Math.round(prev + (amount - prev) * progress))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(flashTimeout)
    }
  }, [amount])

  return (
    <span
      className={`tabular-nums transition-colors duration-300 ease-out ${flash ? 'text-brand-ink' : 'text-ink'} ${className}`}
      aria-live="polite"
    >
      {formatZARWhole(display)}
    </span>
  )
}
