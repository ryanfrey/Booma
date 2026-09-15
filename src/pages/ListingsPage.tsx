import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'
import { formatZAR } from '../lib/currency'

type Listing = Tables<'listings'>

export function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    supabase
      .from('listings')
      .select('*')
      .eq('status', 'live')
      .order('ends_at', { ascending: true })
      .then(({ data }) => {
        if (!cancelled) {
          setListings(data ?? [])
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <p className="listings-status">Loading listings…</p>
  if (listings.length === 0) return <p className="listings-status">No live auctions right now.</p>

  return (
    <ul className="listings-grid">
      {listings.map((listing) => (
        <li key={listing.id} className="listing-card">
          <Link to={`/listings/${listing.id}`}>
            <h2>{listing.title}</h2>
            <p className="listing-price">{formatZAR(listing.current_price)}</p>
          </Link>
        </li>
      ))}
    </ul>
  )
}
