import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'
import { useAuth } from '../contexts/AuthContext'
import { useCountdown } from '../hooks/useCountdown'
import { formatZAR } from '../lib/currency'

type Listing = Tables<'listings'>
// paystack_reference/paystack_authorization_code are deliberately excluded —
// they're not selectable by anon/authenticated (see the protect_bid_payment_columns
// migration) and the Realtime publication for bids only carries these columns.
type Bid = Pick<Tables<'bids'>, 'id' | 'listing_id' | 'bidder_id' | 'amount' | 'is_winning' | 'created_at'>

const BID_COLUMNS = 'id, listing_id, bidder_id, amount, is_winning, created_at'

export function BiddingPanel({ listingId }: { listingId: string }) {
  const { session, user } = useAuth()
  const [listing, setListing] = useState<Listing | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      .select(BID_COLUMNS)
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

  // Returning from Paystack's hosted checkout after a card preauthorization —
  // verify the hold succeeded, then place the bid using the verified amount.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reference = params.get('reference') ?? params.get('trxref')
    if (!reference || !user) return

    const cleanUrl = () => {
      params.delete('reference')
      params.delete('trxref')
      const query = params.toString()
      window.history.replaceState({}, '', window.location.pathname + (query ? `?${query}` : ''))
    }

    setSubmitting(true)
    setError(null)

    supabase.functions
      .invoke<{
        status?: string
        amount?: number
        authorization_code?: string
        error?: string
      }>('paystack-verify-preauth', { body: { reference } })
      .then(async ({ data, error: verifyError }) => {
        if (verifyError || !data?.authorization_code || data.amount === undefined) {
          setError(data?.error ?? verifyError?.message ?? 'Could not verify your card authorization.')
          return
        }

        const { error: rpcError } = await supabase.rpc('place_bid', {
          p_listing_id: listingId,
          p_bidder_id: user.id,
          p_amount: data.amount,
          p_paystack_reference: reference,
          p_paystack_authorization_code: data.authorization_code,
        })

        if (rpcError) setError(rpcError.message)
      })
      .finally(() => {
        setSubmitting(false)
        cleanUrl()
      })
    // Only meant to run once, on return from Paystack — re-running on every
    // listingId/user change would re-verify a stale reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

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
      setError(`Bid must be at least ${formatZAR(minBid)}`)
      return
    }

    setError(null)
    setRedirecting(true)

    const { data, error: initError } = await supabase.functions.invoke<{
      authorization_url?: string
      reference?: string
      error?: string
    }>('paystack-initialize-preauth', {
      body: {
        listing_id: listingId,
        amount: bidAmount,
        callback_url: window.location.origin + window.location.pathname,
      },
    })

    if (initError || !data?.authorization_url) {
      setRedirecting(false)
      setError(data?.error ?? initError?.message ?? 'Could not start card authorization.')
      return
    }

    // Full-page navigation to Paystack's hosted checkout; the bid is only
    // placed once we come back and verify the hold succeeded (see the effect
    // above), so there's no optimistic update here — nothing to roll back.
    window.location.href = data.authorization_url
  }

  return (
    <div className="bidding-panel">
      <p className="current-price">{formatZAR(listing.current_price)}</p>
      <p className="time-left">{timeLeft}</p>
      {isHighBidder && !isEnded && <p className="high-bidder-badge">You're the highest bidder</p>}

      {canBid ? (
        <form onSubmit={handleSubmit} className="bid-form">
          <input
            type="number"
            step="0.01"
            min={minBid}
            placeholder={`${formatZAR(minBid)} or more`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <button type="submit" disabled={submitting || redirecting}>
            {redirecting ? 'Redirecting to card authorization…' : submitting ? 'Placing bid…' : 'Place bid'}
          </button>
        </form>
      ) : isSeller ? (
        <p className="bid-hint">You can't bid on your own listing.</p>
      ) : isEnded || listing.status !== 'live' ? (
        <p className="bid-hint">This auction has ended.</p>
      ) : (
        <p className="bid-hint">Sign in to place a bid.</p>
      )}

      {submitting && !redirecting && <p className="bid-hint">Confirming your card authorization…</p>}
      {error && <p className="auth-error">{error}</p>}

      <ul className="bid-history">
        {bids.map((bid) => (
          <li key={bid.id}>{formatZAR(bid.amount)}</li>
        ))}
      </ul>
    </div>
  )
}
