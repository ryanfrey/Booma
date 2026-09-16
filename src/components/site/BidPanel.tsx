import { Share2 } from 'lucide-react'
import { Countdown } from '../ui/Countdown'
import { PriceTicker } from '../ui/PriceTicker'
import { WatchButton } from '../ui/WatchButton'
import { Button } from '../ui/Button'
import { formatZARWhole } from '../../lib/currency'
import { getBidBreakdown } from '../../lib/buyersPremium'
import { getNextMinBid } from '../../lib/increments'
import type { MockLot } from '../../lib/mockData'

interface BidPanelProps {
  lot: MockLot
  currentBid: number
  bidCount: number
  watched: boolean
  onToggleWatch: () => void
  onOpenBidSheet: () => void
}

function handleShare(title: string) {
  const url = window.location.href
  if (navigator.share) {
    navigator.share({ title, url }).catch(() => {})
  } else {
    navigator.clipboard?.writeText(url).catch(() => {})
  }
}

// Desktop: sticky sidebar with the full panel. Mobile: a compact sticky
// bottom bar (price, timer, Bid button) that opens the same BidSheet —
// per design brief section 3.5.
export function BidPanel({ lot, currentBid, bidCount, watched, onToggleWatch, onOpenBidSheet }: BidPanelProps) {
  const isSold = lot.status === 'sold'
  const minBid = getNextMinBid(currentBid)
  const breakdown = getBidBreakdown(currentBid)

  return (
    <>
      <div className="hidden rounded-tile border border-line p-6 shadow-md lg:sticky lg:top-24 lg:block">
        <PriceTicker amount={isSold ? lot.soldPrice ?? currentBid : currentBid} className="text-display" />
        <p className="mt-1 text-small text-ink-2">
          {bidCount} {bidCount === 1 ? 'bid' : 'bids'}
        </p>

        {!isSold && (
          <div className="mt-2 flex items-center gap-3 text-small">
            <Countdown endsAt={lot.endsAt} />
            {lot.reserveMet !== undefined && (
              <span className={lot.reserveMet ? 'text-brand-ink' : 'text-ink-2'}>
                {lot.reserveMet ? 'Reserve met' : 'Reserve not met'}
              </span>
            )}
          </div>
        )}

        {isSold ? (
          <p className="mt-5 text-small text-ink-2">This lot has sold.</p>
        ) : (
          <>
            <p className="mt-5 text-small text-ink-2">Next bid {formatZARWhole(minBid)}</p>
            <Button variant="primary" size="lg" className="mt-3 w-full" onClick={onOpenBidSheet}>
              Place bid
            </Button>
            <p className="mt-3 text-micro text-ink-2">
              If you win at the current bid, you'll pay approx.{' '}
              <span className="font-semibold text-ink">{formatZARWhole(breakdown.total)}</span> incl. premium &amp;
              VAT.
            </p>
          </>
        )}

        <div className="mt-5 flex gap-2">
          <WatchButton watched={watched} onToggle={onToggleWatch} />
          <button
            type="button"
            onClick={() => handleShare(lot.title)}
            aria-label="Share this lot"
            className="flex h-11 w-11 items-center justify-center rounded-pill border border-line text-ink hover:border-ink"
          >
            <Share2 size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {!isSold && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] shadow-md lg:hidden">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <PriceTicker amount={currentBid} className="text-h2" />
              <Countdown endsAt={lot.endsAt} className="block text-small" />
            </div>
            <Button variant="primary" size="lg" onClick={onOpenBidSheet}>
              Bid
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
