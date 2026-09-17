import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { MockLot } from '../lib/mockData'
import type { CallStage, LiveBidEvent, LotOutcome } from './useMockLiveAuction'

const ADVANCE_TICK_MS = 1_000
const DISPLAY_TICK_MS = 250

interface LotRow {
  id: string
  current_price: number
  current_high_bidder_id: string | null
  live_closes_at: string | null
  sold_price: number | null
  sold_at: string | null
}

function toOutcome(row: LotRow): LotOutcome | undefined {
  if (!row.sold_at) return undefined
  return row.sold_price != null
    ? { status: 'sold', price: row.sold_price, winner: row.current_high_bidder_id ? 'Winning bidder' : 'Pre-bidder' }
    : { status: 'passed' }
}

// Real live-room driver — replaces useMockLiveAuction's fake bidder simulation for an auction
// whose status is actually 'live'. Every connected viewer's browser calls advance_live_auction()
// on a ~1s tick (cheap no-op most of the time, server-validated so an early/late tick can't
// force anything); pg_cron is the backstop for when nobody's watching. Bids are real
// place_lot_bid(phase='live') calls, synced to every viewer via Realtime.
export function useLiveAuction(
  auctionId: string | undefined,
  initialLots: MockLot[],
  initialCurrentLotId: string | null,
  initialStatus: string,
  enabled: boolean,
) {
  const { user } = useAuth()
  const [lots] = useState<MockLot[]>(initialLots)
  const [lotRows, setLotRows] = useState<Record<string, LotRow>>({})
  const [currentLotId, setCurrentLotId] = useState<string | null>(initialCurrentLotId)
  const [status, setStatus] = useState(initialStatus)
  const [remainingMs, setRemainingMs] = useState(0)
  const [feed, setFeed] = useState<LiveBidEvent[]>([])
  const [paused, setPaused] = useState(false)

  // initialCurrentLotId/initialStatus are only known once the parent page's own async auction
  // fetch resolves, so the very first render (before that) always passes currentLotId=null and
  // status='preview' -- and since a postgres_changes subscription only streams future row
  // changes, it never backfills whatever the row's value already was at subscribe time. Without
  // this sync, every fresh page load would show nothing until the next lot happened to change
  // while that tab was open.
  useEffect(() => {
    setCurrentLotId(initialCurrentLotId)
  }, [initialCurrentLotId])

  useEffect(() => {
    setStatus(initialStatus)
  }, [initialStatus])

  useEffect(() => {
    if (!enabled || !auctionId) return

    const channel = supabase
      .channel(`live-auction-${auctionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auctions', filter: `id=eq.${auctionId}` },
        (payload) => {
          const row = payload.new as { current_lot_id: string | null; status: string }
          setCurrentLotId(row.current_lot_id)
          setStatus(row.status)
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'lots', filter: `auction_id=eq.${auctionId}` },
        (payload) => {
          const row = payload.new as LotRow
          setLotRows((prev) => ({ ...prev, [row.id]: row }))
        },
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lot_bids' }, (payload) => {
        const row = payload.new as { id: string; lot_id: string; bidder_id: string; amount: number; phase: string }
        if (row.phase !== 'live') return
        setFeed((prev) => {
          if (prev.some((b) => b.id === row.id)) return prev
          const bidderLabel = row.bidder_id === user?.id ? 'You' : `Bidder ${row.bidder_id.slice(0, 4)}`
          return [{ id: row.id, lotId: row.lot_id, bidderLabel, amount: row.amount }, ...prev].slice(0, 30)
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, auctionId, user?.id])

  // Bid feed shows only live-phase activity on whichever lot is currently being called.
  useEffect(() => {
    setFeed([])
  }, [currentLotId])

  useEffect(() => {
    if (!enabled || !auctionId || paused) return
    const tick = () => supabase.rpc('advance_live_auction', { p_auction_id: auctionId })
    tick()
    const interval = setInterval(tick, ADVANCE_TICK_MS)
    return () => clearInterval(interval)
  }, [enabled, auctionId, paused])

  const currentLotRow = currentLotId ? lotRows[currentLotId] : undefined
  const currentLot = lots.find((l) => l.id === currentLotId)
  const currentIndex = lots.findIndex((l) => l.id === currentLotId)

  useEffect(() => {
    const closesAt = currentLotRow?.live_closes_at
    if (!closesAt) {
      setRemainingMs(0)
      return
    }
    const update = () => setRemainingMs(Math.max(0, new Date(closesAt).getTime() - Date.now()))
    update()
    const interval = setInterval(update, DISPLAY_TICK_MS)
    return () => clearInterval(interval)
  }, [currentLotRow?.live_closes_at])

  const price = currentLotRow?.current_price ?? currentLot?.currentBid ?? 0
  const hasLiveBid = feed.length > 0
  const stage: CallStage = currentLotRow?.sold_at
    ? currentLotRow.sold_price != null
      ? 'sold'
      : 'passed'
    : !hasLiveBid
      ? 'open'
      : remainingMs <= 5_000
        ? 'going-twice'
        : remainingMs <= 10_000
          ? 'going-once'
          : 'bidding'

  const outcomes: Record<string, LotOutcome> = {}
  for (const lot of lots) {
    const row = lotRows[lot.id]
    if (row) {
      const outcome = toOutcome(row)
      if (outcome) outcomes[lot.id] = outcome
    }
  }

  const placeBid = async (amount: number): Promise<{ error?: string }> => {
    if (!currentLotId || !user) return { error: 'Sign in to bid.' }
    const { error } = await supabase.rpc('place_lot_bid', {
      p_lot_id: currentLotId,
      p_bidder_id: user.id,
      p_amount: amount,
      p_phase: 'live',
    })
    if (error) return { error: error.message }
    return {}
  }

  return {
    lots,
    currentLot,
    currentIndex: currentIndex === -1 ? lots.length : currentIndex,
    isDone: status === 'ended',
    price,
    remainingMs,
    stage,
    outcomes,
    feed,
    paused,
    setPaused,
    placeBid,
  }
}
