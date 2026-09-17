import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { PackageSearch, Pencil, Play, Radio } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { formatZARWhole } from '../../lib/currency'
import { CATEGORIES, CONDITIONS } from '../../lib/mockData'
import {
  createLot,
  getAuctionAdmin,
  listLotsAdmin,
  setAuctionStatus,
  updateLot,
  type AuctionRow,
  type LotRow,
} from '../../lib/auctions'

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
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const load = async (auctionId: string) => {
    const [auctionRow, lotRows] = await Promise.all([getAuctionAdmin(auctionId), listLotsAdmin(auctionId)])
    setAuction(auctionRow)
    setLots(lotRows)
  }

  useEffect(() => {
    if (id) load(id)
  }, [id])

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
      if (editingLotId) {
        await updateLot({ id: editingLotId, ...lotFields })
      } else {
        await createLot({ auctionId: id, ...lotFields })
      }
      setForm(EMPTY_FORM)
      setEditingLotId(null)
      await load(id)
    } catch {
      setError(editingLotId ? 'Could not save the lot. Please check the fields and try again.' : 'Could not add the lot. Please check the fields and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const startEditingLot = (lot: LotRow) => {
    setEditingLotId(lot.id)
    setError(null)
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
  }

  const cancelEditingLot = () => {
    setEditingLotId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  const goLive = async () => {
    setStatusUpdating(true)
    try {
      await setAuctionStatus(id, 'live')
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
                    <div>
                      <p className="text-small text-ink-2">Lot {lot.lot_number}</p>
                      <p className="font-semibold text-ink">{lot.title}</p>
                      <p className="text-small text-ink-2">
                        {lot.condition} · {lot.location}
                      </p>
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
