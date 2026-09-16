import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { BidHistory } from '../components/site/BidHistory'
import { BidPanel } from '../components/site/BidPanel'
import { BidSheet } from '../components/site/BidSheet'
import { Gallery } from '../components/ui/Gallery'
import { LotCard } from '../components/ui/LotCard'
import { LotGrid } from '../components/ui/LotGrid'
import { useWatchlist } from '../hooks/useWatchlist'
import { useMockLiveLot } from '../hooks/useMockLiveLot'
import { MOCK_LOTS } from '../lib/mockData'

export function LotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const lot = MOCK_LOTS.find((l) => l.id === id)
  const [bidSheetOpen, setBidSheetOpen] = useState(false)
  const { isWatched, toggle } = useWatchlist()

  // Lot is always defined below this guard, but hooks can't be called
  // conditionally — fall back to the first mock lot so the hook has a
  // stable shape, then redirect immediately if there's really no match.
  const { currentBid, bidCount, history, placeBid } = useMockLiveLot(lot ?? MOCK_LOTS[0])

  if (!lot) return <Navigate to="/listings" replace />

  const otherLots = MOCK_LOTS.filter((l) => l.auctionTitle === lot.auctionTitle && l.id !== lot.id).slice(0, 4)

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 pb-28 sm:px-6 lg:pb-8">
      <p className="text-small text-ink-2">
        {lot.auctionTitle} · Lot {lot.lotNumber} of {lot.lotsInAuction}
      </p>

      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-h1 tracking-tight text-ink">{lot.title}</h1>
          <p className="mt-1 text-small text-ink-2">
            {lot.condition} · {lot.location}
          </p>

          <div className="mt-5">
            <Gallery imageCount={lot.imageCount} title={lot.title} />
          </div>

          <div className="mt-8">
            <h2 className="text-h3 tracking-tight text-ink">Description</h2>
            <p className="mt-2 text-body text-ink-2">{lot.description}</p>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-small font-semibold text-ink">Dimensions</h3>
              <p className="mt-1 text-small text-ink-2">{lot.dimensions}</p>
            </div>
            <div>
              <h3 className="text-small font-semibold text-ink">Condition notes</h3>
              <p className="mt-1 text-small text-ink-2">{lot.conditionNotes}</p>
            </div>
            <div className="sm:col-span-2">
              <h3 className="text-small font-semibold text-ink">Collection &amp; delivery</h3>
              <p className="mt-1 text-small text-ink-2">{lot.collectionDetails}</p>
            </div>
          </div>

          <div className="mt-8">
            <BidHistory bids={history} />
          </div>

          {otherLots.length > 0 && (
            <div className="mt-10">
              <h2 className="text-h2 tracking-tight text-ink">More from this auction</h2>
              <div className="mt-5">
                <LotGrid>
                  {otherLots.map((other) => (
                    <LotCard
                      key={other.id}
                      href={`/listings/${other.id}`}
                      title={other.title}
                      condition={other.condition}
                      location={other.location}
                      currentBid={other.currentBid}
                      bidCount={other.bidCount}
                      endsAt={other.endsAt}
                      status={other.status}
                      soldPrice={other.soldPrice}
                      watched={isWatched(other.id)}
                      onToggleWatch={() => toggle(other.id)}
                    />
                  ))}
                </LotGrid>
              </div>
            </div>
          )}
        </div>

        <div>
          <BidPanel
            lot={lot}
            currentBid={currentBid}
            bidCount={bidCount}
            watched={isWatched(lot.id)}
            onToggleWatch={() => toggle(lot.id)}
            onOpenBidSheet={() => setBidSheetOpen(true)}
          />
        </div>
      </div>

      {bidSheetOpen && (
        <BidSheet
          title={lot.title}
          currentBid={currentBid}
          onClose={() => setBidSheetOpen(false)}
          onConfirm={placeBid}
        />
      )}
    </div>
  )
}
