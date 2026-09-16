import { useEffect, useRef, useState } from 'react'
import { getNextMinBid } from '../lib/increments'
import type { MockLot } from '../lib/mockData'

// Timings per the auctioneer's own spec:
// - A lot opens at its highest pre-bid. If nobody places a live bid within
//   60s, it's knocked down to that pre-bidder (if their bid met reserve) or
//   passed (unsold) if not.
// - The moment someone places a live bid, it becomes "going once, going
//   twice, sold" — a 15s window that resets on every new bid, closing (sold
//   to the last bidder) the instant it runs out with no further bid.
const IDLE_TIMEOUT_MS = 60_000
const BIDDING_WAR_MS = 15_000
const TICK_MS = 250
const SOLD_PAUSE_MS = 2_500

export type LotOutcome = { status: 'sold'; price: number; winner: string } | { status: 'passed' }

export type CallStage = 'open' | 'bidding' | 'going-once' | 'going-twice' | 'sold' | 'passed'

export interface LiveBidEvent {
  id: string
  lotId: string
  bidderLabel: string
  amount: number
}

const BIDDER_POOL = ['Bidder 12', 'Bidder 47', 'Bidder 8', 'Bidder 103', 'Bidder 61', 'Bidder 29', 'Floor']

function randomBidder() {
  return BIDDER_POOL[Math.floor(Math.random() * BIDDER_POOL.length)]
}

interface Engine {
  price: number
  bidCount: number
  remainingMs: number
  lastBidder: string
}

// Simulates the whole live session — a stand-in for the real
// auctioneer-operated / server-authoritative version this becomes once
// backend wiring lands. All "other bidders" here are randomly generated;
// the current viewer can jump into a bidding war via placeBid.
export function useMockLiveAuction(lots: MockLot[]) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [snapshot, setSnapshot] = useState<{ price: number; remainingMs: number; stage: CallStage }>(() => ({
    price: lots[0]?.currentBid ?? 0,
    remainingMs: IDLE_TIMEOUT_MS,
    stage: 'open',
  }))
  const [outcomes, setOutcomes] = useState<Record<string, LotOutcome>>({})
  const [feed, setFeed] = useState<LiveBidEvent[]>([])
  const [paused, setPaused] = useState(false)

  const engineRef = useRef<Engine>({ price: 0, bidCount: 0, remainingMs: IDLE_TIMEOUT_MS, lastBidder: '' })
  const currentLot = lots[currentIndex] as MockLot | undefined

  useEffect(() => {
    if (!currentLot) return
    engineRef.current = { price: currentLot.currentBid, bidCount: 0, remainingMs: IDLE_TIMEOUT_MS, lastBidder: '' }
    setSnapshot({ price: currentLot.currentBid, remainingMs: IDLE_TIMEOUT_MS, stage: 'open' })
  }, [currentLot?.id])

  const registerBid = (lotId: string, amount: number, bidderLabel: string) => {
    const e = engineRef.current
    e.price = amount
    e.bidCount += 1
    e.remainingMs = BIDDING_WAR_MS
    e.lastBidder = bidderLabel
    setFeed((prev) => [{ id: `${lotId}-${Date.now()}-${Math.random()}`, lotId, bidderLabel, amount }, ...prev].slice(0, 30))
  }

  const placeBid = (amount: number) => {
    if (currentLot) registerBid(currentLot.id, amount, 'You')
  }

  useEffect(() => {
    if (!currentLot || paused) return
    let resolved = false

    const interval = setInterval(() => {
      if (resolved) return
      const e = engineRef.current

      const bidChance = e.bidCount === 0 ? 0.005 : 0.01
      if (Math.random() < bidChance) {
        registerBid(currentLot.id, getNextMinBid(e.price), randomBidder())
      }

      e.remainingMs -= TICK_MS

      if (e.remainingMs > 0) {
        const stage: CallStage =
          e.bidCount === 0
            ? 'open'
            : e.remainingMs <= 5_000
              ? 'going-twice'
              : e.remainingMs <= 10_000
                ? 'going-once'
                : 'bidding'
        setSnapshot({ price: e.price, remainingMs: e.remainingMs, stage })
        return
      }

      resolved = true
      clearInterval(interval)

      const outcome: LotOutcome =
        e.bidCount === 0
          ? currentLot.bidCount > 0 && currentLot.reserveMet !== false
            ? { status: 'sold', price: currentLot.currentBid, winner: 'Pre-bidder' }
            : { status: 'passed' }
          : { status: 'sold', price: e.price, winner: e.lastBidder }

      setOutcomes((prev) => ({ ...prev, [currentLot.id]: outcome }))
      setSnapshot({ price: e.price, remainingMs: 0, stage: outcome.status === 'sold' ? 'sold' : 'passed' })
      setTimeout(() => setCurrentIndex((i) => i + 1), SOLD_PAUSE_MS)
    }, TICK_MS)

    return () => {
      resolved = true
      clearInterval(interval)
    }
  }, [currentLot?.id, paused])

  return {
    currentLot,
    currentIndex,
    isDone: currentIndex >= lots.length,
    price: snapshot.price,
    remainingMs: snapshot.remainingMs,
    stage: snapshot.stage,
    outcomes,
    feed,
    paused,
    setPaused,
    placeBid,
  }
}
