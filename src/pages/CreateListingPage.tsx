import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'
import { useAuth } from '../contexts/AuthContext'

type Category = Tables<'categories'>

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like new' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
]

const DURATIONS = [
  { days: 1, label: '1 day' },
  { days: 3, label: '3 days' },
  { days: 5, label: '5 days' },
  { days: 7, label: '7 days' },
]

interface PhotoDraft {
  file: File
  previewUrl: string
}

export function CreateListingPage() {
  const { session, profile, user } = useAuth()
  const navigate = useNavigate()

  const [categories, setCategories] = useState<Category[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [condition, setCondition] = useState('good')
  const [startingPrice, setStartingPrice] = useState('')
  const [bidIncrement, setBidIncrement] = useState('1')
  const [durationDays, setDurationDays] = useState(5)
  const [photos, setPhotos] = useState<PhotoDraft[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('name')
      .then(({ data }) => setCategories(data ?? []))
  }, [])

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!session) return <Navigate to="/auth" replace />
  if (!profile?.is_seller) return <Navigate to="/sell" replace />

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    setPhotos((prev) => [...prev, ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))])
    event.target.value = ''
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return

    const price = Number(startingPrice)
    const increment = Number(bidIncrement)
    if (!Number.isFinite(price) || price <= 0) {
      setError('Enter a valid starting price')
      return
    }
    if (!Number.isFinite(increment) || increment <= 0) {
      setError('Enter a valid bid increment')
      return
    }

    setError(null)
    setSubmitting(true)

    const { data: listing, error: insertError } = await supabase
      .from('listings')
      .insert({
        seller_id: user.id,
        category_id: categoryId ? Number(categoryId) : null,
        title,
        description: description || null,
        condition,
        starting_price: price,
        current_price: price,
        bid_increment: increment,
        status: 'draft',
        ends_at: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id')
      .single()

    if (insertError || !listing) {
      setSubmitting(false)
      setError(insertError?.message ?? 'Could not create the listing')
      return
    }

    for (const [index, photo] of photos.entries()) {
      const extension = photo.file.name.split('.').pop() || 'jpg'
      const path = `listings/${listing.id}/${crypto.randomUUID()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('listing-photos')
        .upload(path, photo.file, { contentType: photo.file.type })

      if (uploadError) {
        setSubmitting(false)
        setError(`Photo upload failed: ${uploadError.message}. Your listing was saved as a draft — try again.`)
        return
      }

      const { error: imageInsertError } = await supabase
        .from('listing_images')
        .insert({ listing_id: listing.id, storage_path: path, position: index })

      if (imageInsertError) {
        setSubmitting(false)
        setError(`Could not save photo: ${imageInsertError.message}`)
        return
      }
    }

    const { error: publishError } = await supabase
      .from('listings')
      .update({ status: 'live', starts_at: new Date().toISOString() })
      .eq('id', listing.id)

    setSubmitting(false)

    if (publishError) {
      setError(publishError.message)
      return
    }

    navigate(`/listings/${listing.id}`)
  }

  return (
    <div className="create-listing-page">
      <h1>Create a listing</h1>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Title
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>

        <label>
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
        </label>

        <label>
          Category
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Condition
          <select value={condition} onChange={(e) => setCondition(e.target.value)}>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Starting price (ZAR)
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
            required
          />
        </label>

        <label>
          Bid increment (ZAR)
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={bidIncrement}
            onChange={(e) => setBidIncrement(e.target.value)}
            required
          />
        </label>

        <label>
          Auction length
          <select value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))}>
            {DURATIONS.map((d) => (
              <option key={d.days} value={d.days}>
                {d.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Photos
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handlePhotoChange} />
        </label>

        {photos.length > 0 && (
          <ul className="photo-preview-list">
            {photos.map((photo, index) => (
              <li key={photo.previewUrl}>
                <img src={photo.previewUrl} alt="" />
                <button type="button" onClick={() => removePhoto(index)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="form-sticky-footer">
          <div className="form-sticky-footer-inner">
            {error && <p className="auth-error">{error}</p>}
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Publishing…' : 'Publish listing'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
