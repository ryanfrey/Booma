import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'
import { useAuth } from '../contexts/AuthContext'
import { formatZAR } from '../lib/currency'
import { getListingPhotoUrl } from '../lib/storage'

type Listing = Tables<'listings'>
type Payment = Tables<'payments'>

const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Payment pending',
  processing: 'Payment processing',
  authorized: 'Payment authorized',
  captured: 'Payment received',
  failed: 'Payment failed',
  refunded: 'Payment refunded',
}

export function WinsPage() {
  const { session, user } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [listings, setListings] = useState<Record<string, Listing>>({})
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const loadWins = async () => {
    if (!user) return
    setLoading(true)

    const { data: paymentRows } = await supabase
      .from('payments')
      .select('*')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })

    const own = paymentRows ?? []
    setPayments(own)
    setLoading(false)

    if (own.length === 0) return

    const listingIds = own.map((p) => p.listing_id)

    const [{ data: listingRows }, { data: images }] = await Promise.all([
      supabase.from('listings').select('*').in('id', listingIds),
      supabase.from('listing_images').select('listing_id, storage_path').in('listing_id', listingIds).eq('position', 0),
    ])

    setListings(Object.fromEntries((listingRows ?? []).map((l) => [l.id, l])))
    setThumbnails(
      Object.fromEntries((images ?? []).map((img) => [img.listing_id, getListingPhotoUrl(img.storage_path)])),
    )
  }

  useEffect(() => {
    loadWins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`wins-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `buyer_id=eq.${user.id}` },
        () => {
          loadWins()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  if (!session) return <Navigate to="/auth" replace />

  const total = payments.reduce((sum, p) => sum + p.amount + p.buyer_premium, 0)

  return (
    <div className="seller-dashboard">
      <h1>My wins</h1>

      {loading ? (
        <p className="listings-status">Loading…</p>
      ) : payments.length === 0 ? (
        <p className="listings-status">You haven't won anything yet.</p>
      ) : (
        <>
          <ul className="dashboard-list">
            {payments.map((payment) => {
              const listing = listings[payment.listing_id]
              const itemTotal = payment.amount + payment.buyer_premium

              return (
                <li key={payment.id} className="dashboard-row">
                  {thumbnails[payment.listing_id] && (
                    <img className="dashboard-thumb" src={thumbnails[payment.listing_id]} alt="" />
                  )}
                  <div className="dashboard-row-body">
                    {listing ? (
                      <Link to={`/listings/${listing.id}`}>{listing.title}</Link>
                    ) : (
                      <span>Listing</span>
                    )}
                    <div className="dashboard-row-meta">
                      <span>Winning bid {formatZAR(payment.amount)}</span>
                      <span>Buyer's premium {formatZAR(payment.buyer_premium)}</span>
                      <span>Total {formatZAR(itemTotal)}</span>
                      <span>{PAYMENT_LABELS[payment.status] ?? payment.status}</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="wins-total">Total across all wins: {formatZAR(total)}</p>
        </>
      )}
    </div>
  )
}
