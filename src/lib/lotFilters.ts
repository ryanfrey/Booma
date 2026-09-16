import type { LotFilters } from '../components/site/FilterPanel'
import type { MockLot } from './mockData'

export type SortOption = 'ending-soonest' | 'newest' | 'lowest-bid' | 'most-bids'

const ENDING_WITHIN_MS: Record<LotFilters['endingWithin'], number | null> = {
  any: null,
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
}

export function filterLots(lots: MockLot[], filters: LotFilters, query: string): MockLot[] {
  const q = query.trim().toLowerCase()
  const endingWithinMs = ENDING_WITHIN_MS[filters.endingWithin]
  const now = Date.now()

  return lots.filter((lot) => {
    if (q && !lot.title.toLowerCase().includes(q)) return false
    if (filters.rooms.length > 0 && !filters.rooms.includes(lot.room)) return false
    if (filters.categories.length > 0 && !filters.categories.includes(lot.category)) return false
    if (filters.conditions.length > 0 && !filters.conditions.includes(lot.condition)) return false
    if (filters.auctionType === 'live' && lot.status !== 'live') return false
    if (filters.auctionType === 'timed' && lot.status === 'live') return false

    const price = lot.status === 'sold' ? lot.soldPrice ?? 0 : lot.currentBid
    if (filters.minPrice && price < Number(filters.minPrice)) return false
    if (filters.maxPrice && price > Number(filters.maxPrice)) return false

    if (endingWithinMs !== null) {
      const remaining = new Date(lot.endsAt).getTime() - now
      if (remaining < 0 || remaining > endingWithinMs) return false
    }

    return true
  })
}

export function sortLots(lots: MockLot[], sort: SortOption): MockLot[] {
  const sorted = [...lots]
  switch (sort) {
    case 'ending-soonest':
      return sorted.sort((a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime())
    case 'newest':
      return sorted.sort((a, b) => b.lotNumber - a.lotNumber)
    case 'lowest-bid':
      return sorted.sort((a, b) => a.currentBid - b.currentBid)
    case 'most-bids':
      return sorted.sort((a, b) => b.bidCount - a.bidCount)
  }
}
