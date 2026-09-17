import { Gavel, List, Pause, Play, Radio } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { PriceTicker } from '../components/ui/PriceTicker'
import { useAuth } from '../contexts/AuthContext'
import { useMockLiveAuction, type CallStage } from '../hooks/useMockLiveAuction'
import { useLiveAuction } from '../hooks/useLiveAuction'
import { formatZARWhole } from '../lib/currency'
import { getNextMinBid } from '../lib/increments'
import { getAuctionWithLots } from '../lib/auctions'
import type { MockAuction, MockLot } from '../lib/mockData'

const CALL_LABEL: Record<CallStage, string> = {
  open: 'Open for bids',
  bidding: 'Bidding',
  'going-once': 'Going once…',
  'going-twice': 'Going twice…',
  sold: 'Sold!',
  passed: 'Passed — no sale',
}

export function LiveAuctionPage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const [auction, setAuction] = useState<MockAuction | null | undefined>(undefined)
  const [lots, setLots] = useState<MockLot[]>([])
  const [view, setView] = useState<'stage' | 'list'>('stage')
  const [bidError, setBidError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    getAuctionWithLots(id).then((result) => {
      if (cancelled) return
      setAuction(result?.auction ?? null)
      setLots(result?.lots.sort((a, b) => a.lotNumber - b.lotNumber) ?? [])
    })
    return () => {
      cancelled = true
    }
  }, [id])

  // "Run demo" (no status change) always gets the fake simulation, for rehearsal. "Go live"
  // flips auction.status to 'live' before navigating here, which is what actually switches this
  // page over to the real, server-authoritative room. Both hooks are called unconditionally
  // (hooks can't be conditional) and only the active one's ticking/subscriptions do anything real.
  const isRealLive = auction?.status === 'live'
  const mock = useMockLiveAuction(lots)
  const real = useLiveAuction(id, lots, auction?.currentLotId ?? null, auction?.status ?? 'preview', isRealLive)

  const { currentLot, currentIndex, isDone, price, remainingMs, stage, outcomes, feed, paused, setPaused } = isRealLive
    ? real
    : mock
  const placeBid = isRealLive
    ? real.placeBid
    : async (amount: number): Promise<{ error?: string }> => {
        mock.placeBid(amount)
        return {}
      }

  if (auction === null) return <Navigate to="/listings" replace />
  if (auction === undefined) return null

  const seconds = Math.ceil(remainingMs / 1000)
  const isResolving = stage === 'sold' || stage === 'passed'
  const paymentMethodVerified = !isRealLive || Boolean(profile?.payment_method_verified_at)
  const canBid = !isResolving && !isDone && feed[0]?.bidderLabel !== 'You' && paymentMethodVerified

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-small font-semibold text-brand-ink">
            <Radio size={14} strokeWidth={1.75} /> {isRealLive ? 'Live now' : 'Live now (demo simulation)'}
          </p>
          <h1 className="mt-1 text-h2 tracking-tight text-ink">{auction.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-small text-ink-2">
            <span className="h-2 w-2 rounded-pill bg-brand" /> Connected
          </span>
          <Button variant="outline" size="md" onClick={() => setPaused(!paused)}>
            {paused ? <Play size={16} strokeWidth={1.5} /> : <Pause size={16} strokeWidth={1.5} />}
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button variant="outline" size="md" onClick={() => setView(view === 'stage' ? 'list' : 'stage')}>
            <List size={16} strokeWidth={1.5} />
            {view === 'stage' ? 'View all lots' : 'Back to live'}
          </Button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="mt-8 flex flex-col gap-2">
          {lots.map((lot, index) => {
            const outcome = outcomes[lot.id]
            const isCurrent = index === currentIndex && !isDone
            return (
              <div
                key={lot.id}
                className={`flex items-center justify-between gap-4 rounded-card border p-4 ${
                  isCurrent ? 'border-brand bg-brand-tint' : 'border-line'
                }`}
              >
                <div>
                  <p className="text-small text-ink-2">Lot {lot.lotNumber}</p>
                  <p className="font-semibold text-ink">{lot.title}</p>
                </div>
                <div className="text-right text-small">
                  {isCurrent ? (
                    <span className="font-semibold text-brand-ink">Live now</span>
                  ) : outcome?.status === 'sold' ? (
                    <span className="text-ink">
                      Sold {formatZARWhole(outcome.price)}
                      <span className="block text-micro text-ink-2">{outcome.winner}</span>
                    </span>
                  ) : outcome?.status === 'passed' ? (
                    <span className="text-ink-2">Passed</span>
                  ) : (
                    <span className="text-ink-2">
                      Upcoming
                      <span className="block text-micro">
                        Est. {formatZARWhole(lot.estimateLow)} – {formatZARWhole(lot.estimateHigh)}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : isDone ? (
        <div className="mt-8 rounded-tile border border-line p-10 text-center">
          <h2 className="text-h2 tracking-tight text-ink">Auction complete</h2>
          <p className="mt-2 text-body text-ink-2">All {lots.length} lots have been called. Thanks for bidding.</p>
          <Button variant="primary" className="mt-5" onClick={() => setView('list')}>
            View results
          </Button>
        </div>
      ) : currentLot ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-small text-ink-2">
              Lot {currentLot.lotNumber} of {auction.lotCount}
            </p>
            <div className="mt-3 aspect-[4/3] overflow-hidden rounded-tile bg-surface-2">
              {currentLot.imageUrl && (
                <img src={currentLot.imageUrl} alt={currentLot.title} className="h-full w-full object-cover" />
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-h2 tracking-tight text-ink">{currentLot.title}</h2>
                <p className="mt-1 text-small text-ink-2">
                  {currentLot.condition} · {currentLot.location}
                </p>
              </div>
              <span
                className={`rounded-pill px-4 py-1.5 text-small font-semibold ${
                  stage === 'sold'
                    ? 'bg-brand-tint text-brand-ink'
                    : stage === 'passed'
                      ? 'bg-surface-2 text-ink-2'
                      : stage === 'going-once' || stage === 'going-twice'
                        ? 'bg-warning-tint text-warning'
                        : 'bg-surface-2 text-ink'
                }`}
              >
                {CALL_LABEL[stage]}
              </span>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-6">
              <PriceTicker amount={price} className="text-display" />
              {!isResolving && (
                <p className="text-h3 tabular-nums text-ink-2">
                  {seconds}s
                  <span className="ml-2 text-small font-normal text-ink-2">
                    {stage === 'open' ? 'until it closes' : 'left to bid'}
                  </span>
                </p>
              )}
            </div>

            {isRealLive && !paymentMethodVerified ? (
              <Link to="/account/payment-method">
                <Button variant="primary" size="lg" className="mt-6 w-full sm:w-auto">
                  Verify payment method to bid
                </Button>
              </Link>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="mt-6 w-full sm:w-auto"
                disabled={!canBid}
                onClick={() => {
                  placeBid(getNextMinBid(price)).then((result) => {
                    if (result.error) setBidError(result.error)
                  })
                }}
              >
                <Gavel size={18} strokeWidth={1.5} />
                Bid {formatZARWhole(getNextMinBid(price))}
              </Button>
            )}
            {bidError && <p className="mt-2 text-small text-danger">{bidError}</p>}
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-small font-semibold text-ink">Bid feed</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {feed.length === 0 ? (
                  <li className="text-small text-ink-2">No live bids yet on this lot.</li>
                ) : (
                  feed.slice(0, 8).map((bid) => (
                    <li key={bid.id} className="flex justify-between text-small">
                      <span className={bid.bidderLabel === 'You' ? 'font-semibold text-brand-ink' : 'text-ink-2'}>
                        {bid.bidderLabel}
                      </span>
                      <span className="font-semibold tabular-nums text-ink">{formatZARWhole(bid.amount)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="border-t border-line pt-6">
              <h3 className="text-small font-semibold text-ink">Up next</h3>
              <ul className="mt-3 flex flex-col gap-3">
                {lots.slice(currentIndex + 1, currentIndex + 4).map((lot) => (
                  <li key={lot.id} className="text-small">
                    <p className="text-ink-2">Lot {lot.lotNumber}</p>
                    <p className="font-semibold text-ink">{lot.title}</p>
                  </li>
                ))}
                {currentIndex + 1 >= lots.length && <li className="text-small text-ink-2">Last lot in this auction.</li>}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
