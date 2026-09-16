import { useEffect, useState } from 'react'
import { getIncrement, getNextMinBid } from '../lib/increments'
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

const BIDDER_POOL = ['Bidder 12', 'Bidder 47', 'Bidder 8', 'Bidder 103', 'Bidder 61', 'Bidder 29']

function randomBidder() {
  return BIDDER_POOL[Math.floor(Math.random() * BIDDER_POOL.length)]
}

// A lot's bidCount may be far larger than we want to fabricate full history
// for — seed just the most recent few, working backward from the current
// price, so "12 bids" doesn't sit next to an empty-looking history panel.
function seedHistory(currentBid: number, bidCount: number): MockBid[] {
  const seedCount = Math.min(bidCount, 5)
  const history: MockBid[] = []
  let amount = currentBid

  for (let i = 0; i < seedCount; i++) {
    history.push({
      id: `seed-${i}`,
      bidderLabel: randomBidder(),
      amount,
      createdAt: new Date(Date.now() - (i + 1) * 4 * 60_000).toISOString(),
    })
    amount -= getIncrement(amount)
  }

  return history
}

// Simulates other bidders arriving on this lot — a stand-in for the real
// Supabase Realtime subscription that lands with the backend wiring
// milestone (build order step 4/5). Nothing here is server-authoritative;
// it exists purely so the UI has live-updating price/history to react to.
export function useMockLiveLot(lot: MockLot) {
  const [state, setState] = useState<LiveLotState>(() => ({
    currentBid: lot.currentBid,
    bidCount: lot.bidCount,
    history: seedHistory(lot.currentBid, lot.bidCount),
  }))

  useEffect(() => {
    if (lot.status === 'sold') return

    const interval = setInterval(() => {
      if (Math.random() > 0.35) return

      setState((prev) => {
        const amount = getNextMinBid(prev.currentBid)
        const bid: MockBid = { id: `mock-${Date.now()}`, bidderLabel: randomBidder(), amount, createdAt: new Date().toISOString() }
        return { currentBid: amount, bidCount: prev.bidCount + 1, history: [bid, ...prev.history].slice(0, 20) }
      })
    }, 6000)

    return () => clearInterval(interval)
  }, [lot.status])

  const placeBid = (amount: number) => {
    setState((prev) => {
      const bid: MockBid = { id: `you-${Date.now()}`, bidderLabel: 'You', amount, createdAt: new Date().toISOString() }
      return { currentBid: amount, bidCount: prev.bidCount + 1, history: [bid, ...prev.history].slice(0, 20) }
    })
  }

  return { currentBid: state.currentBid, bidCount: state.bidCount, history: state.history, placeBid }
}
