import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'
import { BiddingPanel } from '../components/BiddingPanel'

type Listing = Tables<'listings'>

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [listing, setListing] = useState<Listing | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancelled = false

    supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        if (!data) setNotFound(true)
        setListing(data)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (!id) return null
  if (notFound) return <p className="listings-status">Listing not found.</p>
  if (!listing) return <p className="listings-status">Loading…</p>

  return (
    <div className="listing-detail">
      <h1>{listing.title}</h1>
      {listing.description && <p className="listing-description">{listing.description}</p>}
      <BiddingPanel listingId={listing.id} />
    </div>
  )
}
