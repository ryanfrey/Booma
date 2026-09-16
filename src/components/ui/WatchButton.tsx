import { Heart } from 'lucide-react'

export function WatchButton({
  watched,
  onToggle,
  className = '',
}: {
  watched: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={watched}
      className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-pill border text-small font-semibold transition-colors duration-200 ${
        watched ? 'border-brand bg-brand-tint text-brand-ink' : 'border-line text-ink hover:border-ink'
      } ${className}`}
    >
      <Heart size={16} strokeWidth={1.5} className={watched ? 'fill-brand-ink' : ''} />
      {watched ? 'Watching' : 'Watch'}
    </button>
  )
}
