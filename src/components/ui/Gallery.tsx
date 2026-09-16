import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import { useState } from 'react'

// Placeholder tiles stand in for real photos until Storage-backed images
// land with the Supabase wiring milestone — count is all we have per lot.
export function Gallery({ imageCount, title }: { imageCount: number; title: string }) {
  const [active, setActive] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const count = Math.max(1, imageCount)

  const go = (delta: number) => setActive((i) => (i + delta + count) % count)

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-tile bg-surface-2">
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          aria-label={`View ${title} full screen`}
          className="absolute inset-0"
        />
        <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-pill bg-ink/60 px-2.5 py-1 text-micro font-semibold text-surface">
          <Expand size={13} strokeWidth={1.75} />
          {active + 1} / {count}
        </span>
      </div>

      {count > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {Array.from({ length: count }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Photo ${i + 1}`}
              aria-current={i === active}
              className={`h-16 w-16 shrink-0 rounded-card bg-surface-2 transition-[outline] ${
                i === active ? 'outline-2 outline-offset-2 outline-brand' : ''
              }`}
            />
          ))}
        </div>
      )}

      {fullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90">
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            aria-label="Close"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-pill bg-surface/10 text-surface hover:bg-surface/20"
          >
            <X size={20} strokeWidth={1.5} />
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous photo"
                className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-pill bg-surface/10 text-surface hover:bg-surface/20"
              >
                <ChevronLeft size={22} strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next photo"
                className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-pill bg-surface/10 text-surface hover:bg-surface/20"
              >
                <ChevronRight size={22} strokeWidth={1.5} />
              </button>
            </>
          )}

          <div className="mx-6 aspect-[4/3] w-full max-w-[720px] rounded-card bg-surface-2/20" />
          <span className="absolute bottom-6 text-small font-semibold text-surface">
            {active + 1} / {count}
          </span>
        </div>
      )}
    </div>
  )
}
