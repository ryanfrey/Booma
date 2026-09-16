import { PackageSearch, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DEFAULT_FILTERS, FilterPanel, type LotFilters } from '../components/site/FilterPanel'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { LotCard } from '../components/ui/LotCard'
import { LotCardSkeleton } from '../components/ui/Skeleton'
import { LotGrid } from '../components/ui/LotGrid'
import { useWatchlist } from '../hooks/useWatchlist'
import { filterLots, sortLots, type SortOption } from '../lib/lotFilters'
import { listAllLots } from '../lib/auctions'
import type { MockLot } from '../lib/mockData'

const SORT_LABELS: Record<SortOption, string> = {
  'ending-soonest': 'Ending soonest',
  newest: 'Newest',
  'lowest-bid': 'Lowest bid',
  'most-bids': 'Most bids',
}

export function BrowsePage() {
  const [params] = useSearchParams()
  const [filters, setFilters] = useState<LotFilters>(() => ({
    ...DEFAULT_FILTERS,
    auctionType: params.get('live') ? 'live' : 'all',
  }))
  const [sort, setSort] = useState<SortOption>('ending-soonest')
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const { isWatched, toggle } = useWatchlist()
  const query = params.get('q') ?? ''
  const watchlistOnly = params.get('watchlist') === '1'
  const [allLots, setAllLots] = useState<MockLot[]>([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listAllLots().then((data) => {
      if (cancelled) return
      setAllLots(data)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const lots = useMemo(() => {
    const base = watchlistOnly ? allLots.filter((lot) => isWatched(lot.id)) : allLots
    return sortLots(filterLots(base, filters, query), sort)
  }, [allLots, filters, sort, query, watchlistOnly, isWatched])

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-h1 tracking-tight text-ink">{watchlistOnly ? 'Your watchlist' : 'Browse lots'}</h1>
        <p className="text-small text-ink-2">{lots.length} lots</p>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="outline" size="md" className="lg:hidden" onClick={() => setMobileFiltersOpen(true)}>
          <SlidersHorizontal size={16} strokeWidth={1.5} />
          Filters
        </Button>

        <label className="ml-auto flex items-center gap-2 text-small text-ink-2">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="h-10 rounded-card border border-line px-3 text-small text-ink"
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-8 flex gap-10">
        <div className="hidden lg:block">
          <FilterPanel filters={filters} onChange={setFilters} />
        </div>

        <div className="flex-1">
          {loading ? (
            <LotGrid>
              {Array.from({ length: 8 }).map((_, i) => (
                <LotCardSkeleton key={i} />
              ))}
            </LotGrid>
          ) : lots.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No lots match yet"
              message="Try widening your filters, or check back soon — new lots go live all the time."
              action={
                <Button variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <LotGrid>
              {lots.map((lot) => (
                <LotCard
                  key={lot.id}
                  href={`/listings/${lot.id}`}
                  title={lot.title}
                  imageUrl={lot.imageUrl}
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
                  onQuickBid={lot.status === 'sold' ? undefined : () => {}}
                />
              ))}
            </LotGrid>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <FilterPanel filters={filters} onChange={setFilters} onClose={() => setMobileFiltersOpen(false)} />
      )}
    </div>
  )
}
