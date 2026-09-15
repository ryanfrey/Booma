import { useEffect, useRef, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'
import { useAuth } from '../contexts/AuthContext'
import { useCountdown } from '../hooks/useCountdown'

type Listing = Tables<'listings'>
type Bid = Tables<'bids'>

export function BiddingPanel({ listingId }: { listingId: string }) {
  const { session, user } = useAuth()
  const [listing, setListing] = useState<Listing | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const rollbackRef = useRef<Listing | null>(null)

  const { label: timeLeft, isEnded } = useCountdown(listing?.ends_at ?? new Date().toISOString())

  useEffect(() => {
    let cancelled = false

    supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single()
      .then(({ data }) => {
        if (!cancelled) setListing(data)
      })

    supabase
      .from('bids')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!cancelled) setBids(data ?? [])
      })

    const channel = supabase
      .channel(`listing-${listingId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'listings', filter: `id=eq.${listingId}` },
        (payload) => {
          setListing(payload.new as Listing)
          rollbackRef.current = null
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `listing_id=eq.${listingId}` },
        (payload) => {
          const newBid = payload.new as Bid
          setBids((prev) => (prev.some((b) => b.id === newBid.id) ? prev : [newBid, ...prev].slice(0, 10)))
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [listingId])

  if (!listing) return <p>Loading…</p>

  const minBid = listing.current_price + listing.bid_increment
  const isSeller = user?.id === listing.seller_id
  const isHighBidder = user?.id === listing.current_high_bidder_id
  const canBid = session && !isSeller && !isEnded && listing.status === 'live'

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return

    const bidAmount = Number(amount)
    if (!Number.isFinite(bidAmount) || bidAmount < minBid) {
      setError(`Bid must be at least $${minBid.toFixed(2)}`)
      return
    }

    setError(null)
    setSubmitting(true)
    rollbackRef.current = listing

    setListing({ ...listing, current_price: bidAmount, current_high_bidder_id: user.id })

    const { error: rpcError } = await supabase.rpc('place_bid', {
      p_listing_id: listingId,
      p_bidder_id: user.id,
      p_amount: bidAmount,
    })

    setSubmitting(false)

    if (rpcError) {
      if (rollbackRef.current) setListing(rollbackRef.current)
      rollbackRef.current = null
      setError(rpcError.message)
      return
    }

    setAmount('')
  }

  return (
    <div className="bidding-panel">
      <p className="current-price">${listing.current_price.toFixed(2)}</p>
      <p className="time-left">{timeLeft}</p>
      {isHighBidder && !isEnded && <p className="high-bidder-badge">You're the highest bidder</p>}

      {canBid ? (
        <form onSubmit={handleSubmit} className="bid-form">
          <input
            type="number"
            step="0.01"
            min={minBid}
            placeholder={`$${minBid.toFixed(2)} or more`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Placing bid…' : 'Place bid'}
          </button>
        </form>
      ) : isSeller ? (
        <p className="bid-hint">You can't bid on your own listing.</p>
      ) : isEnded || listing.status !== 'live' ? (
        <p className="bid-hint">This auction has ended.</p>
      ) : (
        <p className="bid-hint">Sign in to place a bid.</p>
      )}

      {error && <p className="auth-error">{error}</p>}

      <ul className="bid-history">
        {bids.map((bid) => (
          <li key={bid.id}>${bid.amount.toFixed(2)}</li>
        ))}
      </ul>
    </div>
  )
}
