import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface LotBid {
  id: string
  bidderLabel: string
  amount: number
  createdAt: string
}

interface LotBidRow {
  id: string
  lot_id: string
  bidder_id: string
  amount: number
  phase: string
  created_at: string
}

function toLotBid(row: LotBidRow, viewerId: string | undefined): LotBid {
  return {
    id: row.id,
    bidderLabel: row.bidder_id === viewerId ? 'You' : `Bidder ${row.bidder_id.slice(0, 4)}`,
    amount: row.amount,
    createdAt: row.created_at,
  }
}

// Real pre-bidding against the lots/lot_bids tables — replaces useMockLiveLot's in-memory
// simulation. Bids go through place_lot_bid() (phase='prebid' here; the live room reuses the
// same RPC with phase='live' via useLiveAuction), which requires a verified payment method and
// enforces the minimum increment server-side.
export function useLotBidding(lotId: string | undefined, initialCurrentPrice: number) {
  const { user } = useAuth()
  const [currentPrice, setCurrentPrice] = useState(initialCurrentPrice)
  const [bidCount, setBidCount] = useState(0)
  const [history, setHistory] = useState<LotBid[]>([])

  useEffect(() => {
    setCurrentPrice(initialCurrentPrice)
  }, [initialCurrentPrice])

  useEffect(() => {
    if (!lotId) return
    let cancelled = false

    supabase
      .from('lot_bids')
      .select('id, lot_id, bidder_id, amount, phase, created_at', { count: 'exact' })
      .eq('lot_id', lotId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, count }) => {
        if (cancelled) return
        setHistory((data ?? []).map((row) => toLotBid(row, user?.id)))
        setBidCount(count ?? data?.length ?? 0)
      })

    const channel = supabase
      .channel(`lot-${lotId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'lots', filter: `id=eq.${lotId}` },
        (payload) => {
          const row = payload.new as { current_price: number }
          setCurrentPrice(row.current_price)
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lot_bids', filter: `lot_id=eq.${lotId}` },
        (payload) => {
          const row = payload.new as LotBidRow
          setHistory((prev) =>
            prev.some((b) => b.id === row.id) ? prev : [toLotBid(row, user?.id), ...prev].slice(0, 20),
          )
          setBidCount((prev) => prev + 1)
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [lotId, user?.id])

  const placeBid = async (amount: number, phase: 'prebid' | 'live' = 'prebid'): Promise<{ error?: string }> => {
    if (!lotId || !user) return { error: 'Sign in to bid.' }

    const { error } = await supabase.rpc('place_lot_bid', {
      p_lot_id: lotId,
      p_bidder_id: user.id,
      p_amount: amount,
      p_phase: phase,
    })

    if (error) return { error: error.message }
    return {}
  }

  return { currentBid: currentPrice, bidCount, history, placeBid }
}
