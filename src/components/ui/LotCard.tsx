import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Countdown } from './Countdown'
import { PriceTicker } from './PriceTicker'
import { StatusChip, type LotStatus } from './StatusChip'
import { formatZARWhole } from '../../lib/currency'

export interface LotCardProps {
  href: string
  title: string
  imageUrl?: string
  condition: string
  location: string
  currentBid: number
  bidCount: number
  endsAt: string
  status?: LotStatus
  soldPrice?: number
  estimateLow?: number
  estimateHigh?: number
  watched?: boolean
  onToggleWatch?: () => void
  onQuickBid?: () => void
  /** Shown top-right of the image for lots in a running live auction, e.g. "Lot 14 of 80". */
  lotProgress?: string
  /** Live viewer count, shown alongside lotProgress. */
  viewerCount?: number
}

export function LotCard({
  href,
  title,
  imageUrl,
  condition,
  location,
  currentBid,
  bidCount,
  endsAt,
  status,
  soldPrice,
  estimateLow,
  estimateHigh,
  watched = false,
  onToggleWatch,
  onQuickBid,
  lotProgress,
  viewerCount,
}: LotCardProps) {
  const isSold = status === 'sold'

  return (
    <article className={`group relative ${isSold ? 'opacity-60' : ''}`}>
      <Link to={href} className="block">
        <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-surface-2">
          {imageUrl && <img src={imageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}

          {onToggleWatch && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                onToggleWatch()
              }}
              aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
              aria-pressed={watched}
              className="absolute top-2 right-2 flex h-9 w-9 items-center justify-center rounded-pill bg-surface/90 text-ink shadow-sm transition-colors duration-200 hover:bg-surface"
            >
              <Heart className={watched ? 'fill-brand text-brand-ink' : 'text-ink'} size={18} strokeWidth={1.5} />
            </button>
          )}

          {status && <StatusChip status={status} className="absolute top-2 left-2" />}

          {onQuickBid && !isSold && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                onQuickBid()
              }}
              className="absolute inset-x-2 bottom-2 hidden h-10 items-center justify-center rounded-pill bg-brand text-small font-semibold text-ink opacity-0 transition-opacity duration-200 ease-out group-hover:flex group-hover:opacity-100 md:flex"
            >
              Quick bid
            </button>
          )}
        </div>

        <h3 className="mt-3 line-clamp-2 text-body font-semibold tracking-tight text-ink">{title}</h3>
        <p className="mt-0.5 text-small text-ink-2">
          {condition} · {location}
        </p>
        {lotProgress && (
          <p className="mt-0.5 text-small text-ink-2">
            {lotProgress}
            {viewerCount !== undefined && ` · ${viewerCount} watching`}
          </p>
        )}

        <div className="mt-2 flex items-baseline justify-between">
          {isSold ? (
            <span className="text-h3 font-bold text-ink-2">{formatZARWhole(soldPrice ?? currentBid)}</span>
          ) : (
            <PriceTicker amount={currentBid} className="text-h3 font-bold" />
          )}
          <span className="text-small text-ink-2">
            {isSold ? 'Sold' : `${bidCount} ${bidCount === 1 ? 'bid' : 'bids'}`}
          </span>
        </div>

        {!isSold && estimateLow !== undefined && estimateHigh !== undefined && (
          <p className="mt-0.5 text-micro text-ink-2">
            Est. {formatZARWhole(estimateLow)} – {formatZARWhole(estimateHigh)}
          </p>
        )}

        {!isSold && <Countdown endsAt={endsAt} className="mt-1 block text-small" />}
      </Link>
    </article>
  )
}
