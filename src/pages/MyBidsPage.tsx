import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatZARWhole } from '../lib/currency'
import { getLotPhotoUrl } from '../lib/storage'
import { listLotImagesByLotIds } from '../lib/auctions'
import { Button } from '../components/ui/Button'
import { StatusChip, type LotStatus } from '../components/ui/StatusChip'
import { BidSheet } from '../components/site/BidSheet'
import { BidHistory } from '../components/site/BidHistory'
import type { LotBid } from '../hooks/useLotBidding'

interface MyBidRow {
  lotId: string
  auctionId: string
  title: string
  thumbnail?: string
  yourBid: number
  currentBid: number
  isWinning: boolean
  isSold: boolean
  soldToYou: boolean
  auctionStatus: string
  prebiddingOpen: boolean
}

function toLotBid(row: { id: string; bidder_id: string; amount: number; created_at: string }, viewerId: string | undefined): LotBid {
  return {
    id: row.id,
    bidderLabel: row.bidder_id === viewerId ? 'You' : `Bidder ${row.bidder_id.slice(0, 4)}`,
    amount: row.amount,
    createdAt: row.created_at,
  }
}

export function MyBidsPage() {
  const { session, user } = useAuth()
  const [rows, setRows] = useState<MyBidRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLotId, setExpandedLotId] = useState<string | null>(null)
  const [history, setHistory] = useState<LotBid[]>([])
  const [biddingLot, setBiddingLot] = useState<MyBidRow | null>(null)

  const load = async () => {
    if (!user) return
    setLoading(true)

    const { data: bidRows } = await supabase
      .from('lot_bids')
      .select('lot_id, amount, created_at')
      .eq('bidder_id', user.id)
      .eq('phase', 'prebid')
      .order('created_at', { ascending: false })

    const yourBidByLot = new Map<string, number>()
    for (const bid of bidRows ?? []) {
      if (!yourBidByLot.has(bid.lot_id)) yourBidByLot.set(bid.lot_id, bid.amount)
    }
    const lotIds = [...yourBidByLot.keys()]

    if (lotIds.length === 0) {
      setRows([])
      setLoading(false)
      return
    }

    const [{ data: lotRows }, imagesByLot] = await Promise.all([
      supabase.from('lots').select('*').in('id', lotIds),
      listLotImagesByLotIds(lotIds),
    ])

    const auctionIds = [...new Set((lotRows ?? []).map((l) => l.auction_id))]
    const { data: auctionRows } = await supabase.from('auctions').select('id, status, live_at').in('id', auctionIds)
    const auctionById = new Map((auctionRows ?? []).map((a) => [a.id, a]))

    const nextRows: MyBidRow[] = (lotRows ?? []).map((lot) => {
      const auction = auctionById.get(lot.auction_id)
      const images = imagesByLot[lot.id]
      return {
        lotId: lot.id,
        auctionId: lot.auction_id,
        title: lot.title,
        thumbnail: images?.[0] ? getLotPhotoUrl(images[0].storage_path) : undefined,
        yourBid: yourBidByLot.get(lot.id) ?? 0,
        currentBid: lot.current_price,
        isWinning: lot.current_high_bidder_id === user.id,
        isSold: lot.sold_at != null,
        soldToYou: lot.sold_at != null && lot.current_high_bidder_id === user.id,
        auctionStatus: auction?.status ?? 'preview',
        prebiddingOpen: (auction?.status ?? 'preview') === 'preview' && (!auction || new Date(auction.live_at) > new Date()),
      }
    })

    nextRows.sort((a, b) => (a.isWinning === b.isWinning ? 0 : a.isWinning ? 1 : -1))
    setRows(nextRows)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`my-bids-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lot_bids', filter: `bidder_id=eq.${user.id}` }, () => load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lots' }, () => load())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const toggleHistory = async (lotId: string) => {
    if (expandedLotId === lotId) {
      setExpandedLotId(null)
      return
    }
    setExpandedLotId(lotId)
    const { data } = await supabase
      .from('lot_bids')
      .select('id, bidder_id, amount, created_at')
      .eq('lot_id', lotId)
      .order('created_at', { ascending: false })
      .limit(20)
    setHistory((data ?? []).map((row) => toLotBid(row, user?.id)))
  }

  if (!session) return <Navigate to="/auth" replace />

  const status = (row: MyBidRow): LotStatus => (row.isSold ? 'sold' : row.isWinning ? 'winning' : 'outbid')

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <h1 className="text-h1 tracking-tight text-ink">My bids</h1>

      {loading ? (
        <p className="mt-6 text-small text-ink-2">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-small text-ink-2">You haven't placed any bids yet.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.lotId} className="rounded-card border border-line p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-card bg-surface-2">
                    {row.thumbnail && <img src={row.thumbnail} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/listings/${row.lotId}`} className="font-semibold text-ink hover:text-brand-ink">
                      {row.title}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-small text-ink-2">
                      <span>Your bid {formatZARWhole(row.yourBid)}</span>
                      {!row.isWinning && <span>Current bid {formatZARWhole(row.currentBid)}</span>}
                      <StatusChip status={status(row)} />
                    </div>
                    {row.isSold && (
                      <p className="mt-1 text-small text-ink-2">
                        {row.soldToYou ? 'You won this lot.' : 'Sold to another bidder.'}
                      </p>
                    )}
                    {!row.isSold && !row.prebiddingOpen && (
                      <p className="mt-1 text-small text-ink-2">
                        {row.auctionStatus === 'live' ? (
                          <Link to={`/auctions/${row.auctionId}/live`} className="font-semibold text-brand-ink">
                            This auction is live — bid in the room
                          </Link>
                        ) : (
                          'Pre-bidding has closed for this auction.'
                        )}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:flex-col sm:items-end sm:justify-start">
                  {!row.isWinning && !row.isSold && row.prebiddingOpen && (
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full sm:w-auto"
                      onClick={() => setBiddingLot(row)}
                    >
                      Bid higher
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleHistory(row.lotId)}
                    className="flex shrink-0 items-center gap-1 text-small text-ink-2 hover:text-ink"
                  >
                    History
                    {expandedLotId === row.lotId ? (
                      <ChevronUp size={16} strokeWidth={1.5} />
                    ) : (
                      <ChevronDown size={16} strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              {expandedLotId === row.lotId && (
                <div className="mt-4">
                  <BidHistory bids={history} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {biddingLot && (
        <BidSheet
          title={biddingLot.title}
          currentBid={biddingLot.currentBid}
          onClose={() => setBiddingLot(null)}
          onConfirm={async (amount) => {
            if (!user) return { error: 'Sign in to bid.' }
            const { error } = await supabase.rpc('place_lot_bid', {
              p_lot_id: biddingLot.lotId,
              p_bidder_id: user.id,
              p_amount: amount,
              p_phase: 'prebid',
            })
            if (error) return { error: error.message }
            await load()
            return {}
          }}
        />
      )}
    </div>
  )
}
