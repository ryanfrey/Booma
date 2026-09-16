import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'
import { useAuth } from '../contexts/AuthContext'
import { formatZAR } from '../lib/currency'
import { getListingPhotoUrl } from '../lib/storage'

type Listing = Tables<'listings'>
type Payment = Tables<'payments'>

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft (unfinished)',
  scheduled: 'Scheduled',
  live: 'Live',
  ended: 'Ended (no bids)',
  sold: 'Sold',
  cancelled: 'Cancelled',
}

const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Payment pending',
  processing: 'Payment processing',
  authorized: 'Payment authorized',
  captured: 'Payment received',
  failed: 'Payment failed',
  refunded: 'Payment refunded',
}

export function SellerDashboardPage() {
  const { session, profile, user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [payments, setPayments] = useState<Record<string, Payment>>({})
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadListings = async () => {
    if (!user) return
    setLoading(true)

    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })

    const own = data ?? []
    setListings(own)
    setLoading(false)

    if (own.length === 0) return

    const ids = own.map((l) => l.id)

    const [{ data: images }, { data: paymentRows }] = await Promise.all([
      supabase.from('listing_images').select('listing_id, storage_path').in('listing_id', ids).eq('position', 0),
      supabase.from('payments').select('*').in('listing_id', ids).eq('seller_id', user.id),
    ])

    setThumbnails(
      Object.fromEntries((images ?? []).map((img) => [img.listing_id, getListingPhotoUrl(img.storage_path)])),
    )
    setPayments(Object.fromEntries((paymentRows ?? []).map((p) => [p.listing_id, p])))
  }

  useEffect(() => {
    loadListings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  if (!session) return <Navigate to="/auth" replace />
  if (!profile?.is_seller) return <Navigate to="/sell" replace />

  const handleDeleteDraft = async (listingId: string) => {
    setError(null)
    setDeletingId(listingId)

    const { error: deleteError } = await supabase.from('listings').delete().eq('id', listingId)

    setDeletingId(null)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setListings((prev) => prev.filter((l) => l.id !== listingId))
  }

  return (
    <div className="seller-dashboard">
      <h1>My listings</h1>
      <p>
        <Link to="/sell/new">Create a new listing</Link>
      </p>

      {error && <p className="auth-error">{error}</p>}

      {loading ? (
        <p className="listings-status">Loading…</p>
      ) : listings.length === 0 ? (
        <p className="listings-status">You haven't listed anything yet.</p>
      ) : (
        <ul className="dashboard-list">
          {listings.map((listing) => {
            const payment = payments[listing.id]
            const isDraft = listing.status === 'draft'

            return (
              <li key={listing.id} className="dashboard-row">
                {thumbnails[listing.id] && (
                  <img className="dashboard-thumb" src={thumbnails[listing.id]} alt="" />
                )}
                <div className="dashboard-row-body">
                  {isDraft ? (
                    <span>{listing.title || '(untitled)'}</span>
                  ) : (
                    <Link to={`/listings/${listing.id}`}>{listing.title}</Link>
                  )}
                  <div className="dashboard-row-meta">
                    <span className={`status-badge status-${listing.status}`}>
                      {STATUS_LABELS[listing.status] ?? listing.status}
                    </span>
                    <span>{formatZAR(listing.current_price)}</span>
                    {listing.status === 'live' && (
                      <span>ends {new Date(listing.ends_at).toLocaleString()}</span>
                    )}
                    {payment && <span>{PAYMENT_LABELS[payment.status] ?? payment.status}</span>}
                  </div>
                </div>
                {isDraft && (
                  <button type="button" onClick={() => handleDeleteDraft(listing.id)} disabled={deletingId === listing.id}>
                    {deletingId === listing.id ? 'Deleting…' : 'Delete draft'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
