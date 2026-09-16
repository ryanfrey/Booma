import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'
import { BiddingPanel } from '../components/BiddingPanel'
import { getListingPhotoUrl } from '../lib/storage'

type Listing = Tables<'listings'>
type ListingImage = Tables<'listing_images'>

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [listing, setListing] = useState<Listing | null>(null)
  const [images, setImages] = useState<ListingImage[]>([])
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

    supabase
      .from('listing_images')
      .select('*')
      .eq('listing_id', id)
      .order('position')
      .then(({ data }) => {
        if (!cancelled) setImages(data ?? [])
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
      {images.length > 0 && (
        <div className="listing-photos">
          {images.map((image) => (
            <img key={image.id} src={getListingPhotoUrl(image.storage_path)} alt="" />
          ))}
        </div>
      )}
      {listing.description && <p className="listing-description">{listing.description}</p>}
      <BiddingPanel listingId={listing.id} />
    </div>
  )
}
