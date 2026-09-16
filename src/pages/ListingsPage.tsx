import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'
import { formatZAR } from '../lib/currency'
import { getListingPhotoUrl } from '../lib/storage'
import { formatTimeLeft } from '../lib/timeLeft'

type Listing = Tables<'listings'>

export function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    supabase
      .from('listings')
      .select('*')
      .eq('status', 'live')
      .order('ends_at', { ascending: true })
      .then(async ({ data }) => {
        if (cancelled) return
        const liveListings = data ?? []
        setListings(liveListings)
        setLoading(false)

        if (liveListings.length === 0) return
        const { data: images } = await supabase
          .from('listing_images')
          .select('listing_id, storage_path')
          .in(
            'listing_id',
            liveListings.map((l) => l.id),
          )
          .eq('position', 0)

        if (cancelled || !images) return
        setThumbnails(
          Object.fromEntries(images.map((img) => [img.listing_id, getListingPhotoUrl(img.storage_path)])),
        )
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <p className="listings-status">Loading listings…</p>
  if (listings.length === 0) return <p className="listings-status">No live auctions right now.</p>

  return (
    <div className="listings-page">
      <h1 className="listings-heading">Live auctions</h1>
      <ul className="listings-grid">
        {listings.map((listing) => (
          <li key={listing.id} className="listing-card">
            <Link to={`/listings/${listing.id}`}>
              <div className="listing-thumb-wrap">
                {thumbnails[listing.id] && <img className="listing-thumb" src={thumbnails[listing.id]} alt="" />}
              </div>
              <h2>{listing.title}</h2>
              <p className="listing-price">{formatZAR(listing.current_price)}</p>
              <span className="listing-time-badge">{formatTimeLeft(listing.ends_at)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
