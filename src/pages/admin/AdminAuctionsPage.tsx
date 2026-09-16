import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Gavel } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { createAuction, listAuctionsAdminWithLotCounts, type AuctionRow } from '../../lib/auctions'

const STATUS_LABEL: Record<string, string> = {
  preview: 'Pre-bidding',
  live: 'Live',
  ended: 'Ended',
}

export function AdminAuctionsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<{ auction: AuctionRow; lotCount: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [liveAt, setLiveAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const data = await listAuctionsAdminWithLotCounts()
    setRows(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title || !location || !liveAt) return
    setSubmitting(true)
    setError(null)
    try {
      const auction = await createAuction({ title, location, liveAt: new Date(liveAt).toISOString() })
      navigate(`/admin/auctions/${auction.id}`)
    } catch {
      setError('Could not create the auction. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <h1 className="text-h1 tracking-tight text-ink">Auctions</h1>
      <p className="mt-1 text-body text-ink-2">Create an auction, add its lots, then run it as a demo or go live.</p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-4 rounded-tile border border-line p-6 sm:grid-cols-3">
        <label className="text-small font-semibold text-ink sm:col-span-1">
          Auction title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Constantia Wine Estate Clearance"
            required
            className="mt-1 h-11 w-full rounded-card border border-line px-3 text-body text-ink"
          />
        </label>
        <label className="text-small font-semibold text-ink sm:col-span-1">
          Location
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Cape Town — collection only"
            required
            className="mt-1 h-11 w-full rounded-card border border-line px-3 text-body text-ink"
          />
        </label>
        <label className="text-small font-semibold text-ink sm:col-span-1">
          Live date &amp; time
          <input
            type="datetime-local"
            value={liveAt}
            onChange={(e) => setLiveAt(e.target.value)}
            required
            className="mt-1 h-11 w-full rounded-card border border-line px-3 text-body text-ink"
          />
        </label>
        {error && <p className="text-small text-danger sm:col-span-3">{error}</p>}
        <div className="sm:col-span-3">
          <Button type="submit" variant="primary" size="md" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create auction'}
          </Button>
        </div>
      </form>

      <div className="mt-10">
        {loading ? (
          <p className="text-small text-ink-2">Loading auctions…</p>
        ) : rows.length === 0 ? (
          <EmptyState icon={Gavel} title="No auctions yet" message="Create your first auction above to get started." />
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map(({ auction, lotCount }) => (
              <Link
                key={auction.id}
                to={`/admin/auctions/${auction.id}`}
                className="flex items-center justify-between gap-4 rounded-card border border-line p-4 hover:border-ink"
              >
                <div>
                  <p className="font-semibold text-ink">{auction.title}</p>
                  <p className="text-small text-ink-2">
                    {auction.location} · {lotCount} {lotCount === 1 ? 'lot' : 'lots'}
                  </p>
                </div>
                <span className="rounded-pill bg-surface-2 px-3 py-1 text-small font-semibold text-ink">
                  {STATUS_LABEL[auction.status] ?? auction.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
