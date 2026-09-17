import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BidHistory } from '../components/site/BidHistory'
import { BidPanel } from '../components/site/BidPanel'
import { BidSheet } from '../components/site/BidSheet'
import { Gallery } from '../components/ui/Gallery'
import { LotCard } from '../components/ui/LotCard'
import { LotGrid } from '../components/ui/LotGrid'
import { Skeleton } from '../components/ui/Skeleton'
import { useWatchlist } from '../hooks/useWatchlist'
import { useLotBidding } from '../hooks/useLotBidding'
import { formatZARWhole } from '../lib/currency'
import { getLotWithAuction } from '../lib/auctions'
import type { MockAuction, MockLot } from '../lib/mockData'

const PLACEHOLDER_LOT: MockLot = {
  id: 'placeholder',
  auctionId: 'placeholder',
  lotNumber: 0,
  title: '',
  images: [],
  condition: '',
  location: '',
  currentBid: 0,
  bidCount: 0,
  endsAt: new Date().toISOString(),
  category: '',
  estimateLow: 0,
  estimateHigh: 0,
  description: '',
  dimensions: '',
  conditionNotes: '',
  collectionDetails: '',
}

function LotDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 pb-28 sm:px-6 lg:pb-8">
      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="mt-2 h-4 w-1/3" />
          <Skeleton className="mt-5 aspect-[4/3] w-full" />
        </div>
        <Skeleton className="h-56 w-full" />
      </div>
    </div>
  )
}

export function LotDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [lot, setLot] = useState<MockLot | null | undefined>(undefined)
  const [auction, setAuction] = useState<MockAuction | undefined>(undefined)
  const [otherLots, setOtherLots] = useState<MockLot[]>([])
  const [bidSheetOpen, setBidSheetOpen] = useState(false)
  const { isWatched, toggle } = useWatchlist()

  useEffect(() => {
    if (!id) return
    let cancelled = false
    getLotWithAuction(id).then((result) => {
      if (cancelled) return
      setLot(result?.lot ?? null)
      setAuction(result?.auction)
      setOtherLots(result?.siblingLots.slice(0, 4) ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [id])

  // Hooks can't be called conditionally — fall back to a stable placeholder
  // lot while the real one loads, then redirect immediately if there's
  // really no match.
  const activeLot = lot ?? PLACEHOLDER_LOT
  const { currentBid, bidCount, history, placeBid } = useLotBidding(lot?.id, activeLot.currentBid)

  if (lot === null) return <Navigate to="/listings" replace />
  if (lot === undefined) return <LotDetailSkeleton />

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 pb-28 sm:px-6 lg:pb-8">
      {auction && (
        <p className="text-small text-ink-2">
          <Link to={`/auctions/${auction.id}`} className="hover:text-brand-ink">
            {auction.title}
          </Link>{' '}
          · Lot {lot.lotNumber} of {auction.lotCount}
        </p>
      )}

      <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-h1 tracking-tight text-ink">{lot.title}</h1>
          <p className="mt-1 text-small text-ink-2">
            {lot.condition} · {lot.location}
          </p>
          <p className="mt-1 text-small text-ink-2">
            Estimate {formatZARWhole(lot.estimateLow)} – {formatZARWhole(lot.estimateHigh)}
          </p>

          <div className="mt-5">
            <Gallery images={lot.images} title={lot.title} />
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
                      imageUrl={other.imageUrl}
                      condition={other.condition}
                      location={other.location}
                      currentBid={other.currentBid}
                      bidCount={other.bidCount}
                      endsAt={other.endsAt}
                      status={other.status}
                      soldPrice={other.soldPrice}
                      estimateLow={other.estimateLow}
                      estimateHigh={other.estimateHigh}
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
