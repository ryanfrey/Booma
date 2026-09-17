import type { LotBid } from '../../hooks/useLotBidding'
import { formatZARWhole } from '../../lib/currency'

export function BidHistory({ bids }: { bids: LotBid[] }) {
  return (
    <div className="rounded-card border border-line p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-h3 tracking-tight text-ink">Bid history</h2>
        <span className="text-micro text-ink-2">Updates live</span>
      </div>

      {bids.length === 0 ? (
        <p className="mt-3 text-small text-ink-2">No bids yet — be the first.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2" aria-live="polite">
          {bids.map((bid) => (
            <li key={bid.id} className="flex items-center justify-between border-b border-line pb-2 text-small last:border-none last:pb-0">
              <span className={bid.bidderLabel === 'You' ? 'font-semibold text-brand-ink' : 'text-ink-2'}>
                {bid.bidderLabel}
              </span>
              <span className="text-ink-2">{new Date(bid.createdAt).toLocaleTimeString('en-ZA')}</span>
              <span className="font-semibold tabular-nums text-ink">{formatZARWhole(bid.amount)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
