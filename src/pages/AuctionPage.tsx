import { Link, Navigate, useParams } from 'react-router-dom'
import { LotCard } from '../components/ui/LotCard'
import { LotGrid } from '../components/ui/LotGrid'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { PackageSearch, Radio } from 'lucide-react'
import { useWatchlist } from '../hooks/useWatchlist'
import { MOCK_AUCTIONS, MOCK_LOTS } from '../lib/mockData'

export function AuctionPage() {
  const { id } = useParams<{ id: string }>()
  const auction = MOCK_AUCTIONS.find((a) => a.id === id)
  const { isWatched, toggle } = useWatchlist()

  if (!auction) return <Navigate to="/listings" replace />

  const lots = MOCK_LOTS.filter((lot) => lot.auctionId === auction.id).sort((a, b) => a.lotNumber - b.lotNumber)

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <p className="text-small font-semibold text-brand-ink">
        Live {new Date(auction.liveAt).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
      </p>
      <h1 className="mt-1 text-h1 tracking-tight text-ink">{auction.title}</h1>
      <p className="mt-2 text-body text-ink-2">{auction.location}</p>
      <p className="mt-1 text-small text-ink-2">
        {auction.lotCount} lots · pre-bidding is open now and closes when the live auction starts
      </p>

      {lots.length > 0 && (
        <Link to={`/auctions/${auction.id}/live`}>
          <Button variant="outline" size="md" className="mt-4">
            <Radio size={16} strokeWidth={1.5} />
            Preview the live room (demo)
          </Button>
        </Link>
      )}

      <div className="mt-8">
        {lots.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="Lots coming soon"
            message="This auction's catalogue hasn't been published yet — check back closer to the live date."
          />
        ) : (
          <LotGrid>
            {lots.map((lot) => (
              <LotCard
                key={lot.id}
                href={`/listings/${lot.id}`}
                title={lot.title}
                condition={lot.condition}
                location={lot.location}
                currentBid={lot.currentBid}
                bidCount={lot.bidCount}
                endsAt={lot.endsAt}
                status={lot.status}
                soldPrice={lot.soldPrice}
                estimateLow={lot.estimateLow}
                estimateHigh={lot.estimateHigh}
                watched={isWatched(lot.id)}
                onToggleWatch={() => toggle(lot.id)}
              />
            ))}
          </LotGrid>
        )}
      </div>
    </div>
  )
}
