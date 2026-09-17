import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { PackageSearch, Pencil, Play, Radio, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatZARWhole } from '../../lib/currency'
import { CATEGORIES, CONDITIONS } from '../../lib/mockData'
import { getLotPhotoUrl } from '../../lib/storage'
import { supabase } from '../../lib/supabase'
import {
  addLotImage,
  advanceLiveAuction,
  createLot,
  deleteLotImage,
  getAuctionAdmin,
  listLotImages,
  listLotImagesByLotIds,
  listLotsAdmin,
  setAuctionStatus,
  updateLot,
  type AuctionRow,
  type LotImageRow,
  type LotRow,
} from '../../lib/auctions'

interface PhotoDraft {
  file: File
  previewUrl: string
}

const EMPTY_FORM: {
  title: string
  category: string
  condition: string
  location: string
  estimateLow: string
  estimateHigh: string
  startingPrice: string
  reservePrice: string
  description: string
  dimensions: string
  conditionNotes: string
  collectionDetails: string
} = {
  title: '',
  category: CATEGORIES[0],
  condition: CONDITIONS[0],
  location: '',
  estimateLow: '',
  estimateHigh: '',
  startingPrice: '',
  reservePrice: '',
  description: '',
  dimensions: '',
  conditionNotes: '',
  collectionDetails: '',
}

export function AdminAuctionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [auction, setAuction] = useState<AuctionRow | null | undefined>(undefined)
  const [lots, setLots] = useState<LotRow[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingLotId, setEditingLotId] = useState<string | null>(null)
  const [photos, setPhotos] = useState<PhotoDraft[]>([])
  const [existingImages, setExistingImages] = useState<LotImageRow[]>([])
  const [lotThumbnails, setLotThumbnails] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const load = async (auctionId: string) => {
    const [auctionRow, lotRows] = await Promise.all([getAuctionAdmin(auctionId), listLotsAdmin(auctionId)])
    setAuction(auctionRow)
    setLots(lotRows)
    const imagesByLot = await listLotImagesByLotIds(lotRows.map((lot) => lot.id))
    setLotThumbnails(
      Object.fromEntries(
        Object.entries(imagesByLot)
          .filter(([, images]) => images.length > 0)
          .map(([lotId, images]) => [lotId, getLotPhotoUrl(images[0].storage_path)]),
      ),
    )
  }

  useEffect(() => {
    if (id) load(id)
  }, [id])

  // Only local object-URL previews need cleanup; already-uploaded images are plain public URLs.
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!id) return <Navigate to="/admin" replace />
  if (auction === null) return <Navigate to="/admin" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.location) return
    setSubmitting(true)
    setError(null)
    try {
      const lotFields = {
        title: form.title,
        category: form.category,
        condition: form.condition,
        location: form.location,
        estimateLow: Number(form.estimateLow) || 0,
        estimateHigh: Number(form.estimateHigh) || 0,
        startingPrice: Number(form.startingPrice) || 0,
        reservePrice: form.reservePrice ? Number(form.reservePrice) : undefined,
        description: form.description,
        dimensions: form.dimensions,
        conditionNotes: form.conditionNotes,
        collectionDetails: form.collectionDetails,
      }
      let lotId: string
      if (editingLotId) {
        await updateLot({ id: editingLotId, ...lotFields })
        lotId = editingLotId
      } else {
        lotId = (await createLot({ auctionId: id, ...lotFields })).id
      }

      // New photos are appended after whatever's already on the lot.
      let nextPosition = existingImages.length
      for (const photo of photos) {
        const extension = photo.file.name.split('.').pop() || 'jpg'
        const path = `lots/${lotId}/${crypto.randomUUID()}.${extension}`
        const { error: uploadError } = await supabase.storage
          .from('lot-photos')
          .upload(path, photo.file, { contentType: photo.file.type })
        if (uploadError) throw uploadError
        await addLotImage(lotId, path, nextPosition)
        nextPosition += 1
      }

      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
      setPhotos([])
      setExistingImages([])
      setForm(EMPTY_FORM)
      setEditingLotId(null)
      await load(id)
    } catch {
      setError(editingLotId ? 'Could not save the lot. Please check the fields and try again.' : 'Could not add the lot. Please check the fields and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    setPhotos((prev) => [...prev, ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))])
    event.target.value = ''
  }

  const removeNewPhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const removeExistingImage = async (image: LotImageRow) => {
    setExistingImages((prev) => prev.filter((i) => i.id !== image.id))
    await deleteLotImage(image)
    if (id) await load(id)
  }

  const startEditingLot = async (lot: LotRow) => {
    setEditingLotId(lot.id)
    setError(null)
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    setPhotos([])
    setForm({
      title: lot.title,
      category: lot.category,
      condition: lot.condition,
      location: lot.location,
      estimateLow: String(lot.estimate_low ?? ''),
      estimateHigh: String(lot.estimate_high ?? ''),
      startingPrice: String(lot.starting_price ?? ''),
      reservePrice: lot.reserve_price != null ? String(lot.reserve_price) : '',
      description: lot.description ?? '',
      dimensions: lot.dimensions ?? '',
      conditionNotes: lot.condition_notes ?? '',
      collectionDetails: lot.collection_details ?? '',
    })
    setExistingImages(await listLotImages(lot.id))
  }

  const cancelEditingLot = () => {
    setEditingLotId(null)
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    setPhotos([])
    setExistingImages([])
    setForm(EMPTY_FORM)
    setError(null)
  }

  const goLive = async () => {
    setStatusUpdating(true)
    try {
      await setAuctionStatus(id, 'live')
      // Opens the first lot right away instead of waiting on a viewer's browser tick to do it.
      await advanceLiveAuction(id)
      navigate(`/auctions/${id}/live`)
    } finally {
      setStatusUpdating(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <Link to="/admin" className="text-small text-ink-2 hover:text-brand-ink">
        ← All auctions
      </Link>

      {auction === undefined ? (
        <p className="mt-4 text-small text-ink-2">Loading…</p>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-h1 tracking-tight text-ink">{auction.title}</h1>
              <p className="mt-1 text-body text-ink-2">
                {auction.location} · {lots.length} {lots.length === 1 ? 'lot' : 'lots'} · live{' '}
                {new Date(auction.live_at).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
            {lots.length > 0 && (
              <div className="flex gap-2">
                <Link to={`/auctions/${id}/live`}>
                  <Button variant="outline" size="md">
                    <Play size={16} strokeWidth={1.5} />
                    Run demo
                  </Button>
                </Link>
                <Button variant="primary" size="md" disabled={statusUpdating} onClick={goLive}>
                  <Radio size={16} strokeWidth={1.5} />
                  {auction.status === 'live' ? 'Live — reopen room' : 'Go live'}
                </Button>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-8 grid gap-4 rounded-tile border border-line p-6 sm:grid-cols-2">
            <h2 className="text-h3 tracking-tight text-ink sm:col-span-2">{editingLotId ? 'Edit lot' : 'Add a lot'}</h2>
            <label className="text-small font-semibold text-ink">
              Title
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
                className="mt-1 h-11 w-full rounded-card border border-line px-3 text-body text-ink"
              />
            </label>
            <label className="text-small font-semibold text-ink">
              Location
              <input
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                required
                className="mt-1 h-11 w-full rounded-card border border-line px-3 text-body text-ink"
              />
            </label>
            <label className="text-small font-semibold text-ink">
              Category
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 h-11 w-full rounded-card border border-line px-3 text-body text-ink"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-small font-semibold text-ink">
              Condition
              <select
                value={form.condition}
                onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))}
                className="mt-1 h-11 w-full rounded-card border border-line px-3 text-body text-ink"
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-small font-semibold text-ink">
              Estimate low (R)
              <input
                type="number"
                min={0}
                value={form.estimateLow}
                onChange={(e) => setForm((f) => ({ ...f, estimateLow: e.target.value }))}
                className="mt-1 h-11 w-full rounded-card border border-line px-3 text-body text-ink"
              />
            </label>
            <label className="text-small font-semibold text-ink">
              Estimate high (R)
              <input
                type="number"
                min={0}
                value={form.estimateHigh}
                onChange={(e) => setForm((f) => ({ ...f, estimateHigh: e.target.value }))}
                className="mt-1 h-11 w-full rounded-card border border-line px-3 text-body text-ink"
              />
            </label>
            <label className="text-small font-semibold text-ink">
              Starting price (R)
              <input
                type="number"
                min={0}
                value={form.startingPrice}
                onChange={(e) => setForm((f) => ({ ...f, startingPrice: e.target.value }))}
                className="mt-1 h-11 w-full rounded-card border border-line px-3 text-body text-ink"
              />
            </label>
            <label className="text-small font-semibold text-ink">
              Reserve price (R) — optional
              <input
                type="number"
                min={0}
                value={form.reservePrice}
                onChange={(e) => setForm((f) => ({ ...f, reservePrice: e.target.value }))}
                placeholder="No reserve"
                className="mt-1 h-11 w-full rounded-card border border-line px-3 text-body text-ink"
              />
            </label>
            <label className="text-small font-semibold text-ink">
              Dimensions
              <input
                value={form.dimensions}
                onChange={(e) => setForm((f) => ({ ...f, dimensions: e.target.value }))}
                className="mt-1 h-11 w-full rounded-card border border-line px-3 text-body text-ink"
              />
            </label>
            <label className="text-small font-semibold text-ink sm:col-span-2">
              Description
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-card border border-line px-3 py-2 text-body text-ink"
              />
            </label>
            <label className="text-small font-semibold text-ink sm:col-span-2">
              Condition notes
              <textarea
                value={form.conditionNotes}
                onChange={(e) => setForm((f) => ({ ...f, conditionNotes: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-card border border-line px-3 py-2 text-body text-ink"
              />
            </label>
            <label className="text-small font-semibold text-ink sm:col-span-2">
              Collection &amp; delivery details
              <textarea
                value={form.collectionDetails}
                onChange={(e) => setForm((f) => ({ ...f, collectionDetails: e.target.value }))}
                rows={2}
                className="mt-1 w-full rounded-card border border-line px-3 py-2 text-body text-ink"
              />
            </label>
            <label className="text-small font-semibold text-ink sm:col-span-2">
              Photos
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handlePhotoChange}
                className="mt-1 block w-full text-body text-ink"
              />
            </label>
            {(existingImages.length > 0 || photos.length > 0) && (
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                {existingImages.map((image) => (
                  <div key={image.id} className="relative h-20 w-20 overflow-hidden rounded-card bg-surface-2">
                    <img src={getLotPhotoUrl(image.storage_path)} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(image)}
                      aria-label="Remove photo"
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-pill bg-ink/70 text-surface"
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  </div>
                ))}
                {photos.map((photo, index) => (
                  <div key={photo.previewUrl} className="relative h-20 w-20 overflow-hidden rounded-card bg-surface-2">
                    <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(index)}
                      aria-label="Remove photo"
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-pill bg-ink/70 text-surface"
                    >
                      <X size={14} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {error && <p className="text-small text-danger sm:col-span-2">{error}</p>}
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" variant="primary" size="md" disabled={submitting}>
                {submitting ? 'Saving…' : editingLotId ? 'Save changes' : 'Add lot'}
              </Button>
              {editingLotId && (
                <Button type="button" variant="outline" size="md" onClick={cancelEditingLot} disabled={submitting}>
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="mt-10">
            {lots.length === 0 ? (
              <EmptyState icon={PackageSearch} title="No lots yet" message="Add this auction's first lot above." />
            ) : (
              <div className="flex flex-col gap-2">
                {lots.map((lot) => (
                  <div key={lot.id} className="flex items-center justify-between gap-4 rounded-card border border-line p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-card bg-surface-2">
                        {lotThumbnails[lot.id] && (
                          <img src={lotThumbnails[lot.id]} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="text-small text-ink-2">Lot {lot.lot_number}</p>
                        <p className="font-semibold text-ink">{lot.title}</p>
                        <p className="text-small text-ink-2">
                          {lot.condition} · {lot.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-small text-ink-2">
                        Est. {formatZARWhole(lot.estimate_low)} – {formatZARWhole(lot.estimate_high)}
                      </p>
                      <Button variant="outline" size="md" onClick={() => startEditingLot(lot)}>
                        <Pencil size={16} strokeWidth={1.5} />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
