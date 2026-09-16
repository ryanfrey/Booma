import { useState } from 'react'
import type { MockLot } from '../lib/mockData'

export interface MockBid {
  id: string
  bidderLabel: string
  amount: number
  createdAt: string
}

interface LiveLotState {
  currentBid: number
  bidCount: number
  history: MockBid[]
}

// Pre-bidding is placed directly against the lot's real current price —
// unlike the live room (see useMockLiveAuction, still an intentional mock
// simulation), there's no fabricated "other bidder" activity here since
// these are real admin-created lots.
export function useMockLiveLot(lot: MockLot) {
  const [state, setState] = useState<LiveLotState>({
    currentBid: lot.currentBid,
    bidCount: lot.bidCount,
    history: [],
  })

  const placeBid = (amount: number) => {
    setState((prev) => {
      const bid: MockBid = { id: `you-${Date.now()}`, bidderLabel: 'You', amount, createdAt: new Date().toISOString() }
      return { currentBid: amount, bidCount: prev.bidCount + 1, history: [bid, ...prev.history].slice(0, 20) }
    })
  }

  return { currentBid: state.currentBid, bidCount: state.bidCount, history: state.history, placeBid }
}
