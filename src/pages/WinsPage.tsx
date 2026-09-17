import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Tables } from '../lib/database.types'
import { useAuth } from '../contexts/AuthContext'
import { formatZAR } from '../lib/currency'
import { getListingPhotoUrl } from '../lib/storage'

type Listing = Tables<'listings'>
type Payment = Tables<'payments'>
type LotPayment = Tables<'lot_payments'>
type Lot = Tables<'lots'>

const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Payment pending',
  processing: 'Payment processing',
  authorized: 'Payment authorized',
  captured: 'Payment received',
  failed: 'Payment failed',
  refunded: 'Payment refunded',
}

interface WinRow {
  id: string
  title: string
  href?: string
  thumbnail?: string
  amount: number
  buyerPremium: number
  status: string
  createdAt: string
}

export function WinsPage() {
  const { session, user } = useAuth()
  const [wins, setWins] = useState<WinRow[]>([])
  const [loading, setLoading] = useState(true)

  const loadWins = async () => {
    if (!user) return
    setLoading(true)

    const [{ data: paymentRows }, { data: lotPaymentRows }] = await Promise.all([
      supabase.from('payments').select('*').eq('buyer_id', user.id),
      supabase.from('lot_payments').select('*').eq('buyer_id', user.id),
    ])

    const payments: Payment[] = paymentRows ?? []
    const lotPayments: LotPayment[] = lotPaymentRows ?? []

    const [listingsById, thumbnailsByListingId, lotsById] = await Promise.all([
      loadListings(payments),
      loadThumbnails(payments),
      loadLots(lotPayments),
    ])

    const listingWins: WinRow[] = payments.map((payment) => {
      const listing = listingsById[payment.listing_id]
      return {
        id: payment.id,
        title: listing?.title ?? 'Listing',
        href: listing ? `/listings/${listing.id}` : undefined,
        thumbnail: thumbnailsByListingId[payment.listing_id],
        amount: payment.amount,
        buyerPremium: payment.buyer_premium,
        status: payment.status,
        createdAt: payment.created_at ?? '',
      }
    })

    const lotWins: WinRow[] = lotPayments.map((payment) => {
      const lot = lotsById[payment.lot_id]
      return {
        id: payment.id,
        title: lot?.title ?? 'Lot',
        href: lot ? `/listings/${lot.id}` : undefined,
        amount: payment.amount,
        buyerPremium: payment.buyer_premium,
        status: payment.status,
        createdAt: payment.created_at,
      }
    })

    setWins([...listingWins, ...lotWins].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)))
    setLoading(false)
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
        () => loadWins(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lot_payments', filter: `buyer_id=eq.${user.id}` },
        () => loadWins(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  if (!session) return <Navigate to="/auth" replace />

  const total = wins.reduce((sum, w) => sum + w.amount + w.buyerPremium, 0)

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6">
      <h1 className="text-h1 tracking-tight text-ink">My wins</h1>

      {loading ? (
        <p className="mt-6 text-small text-ink-2">Loading…</p>
      ) : wins.length === 0 ? (
        <p className="mt-6 text-small text-ink-2">You haven't won anything yet.</p>
      ) : (
        <>
          <ul className="mt-6 flex flex-col gap-2">
            {wins.map((win) => {
              const itemTotal = win.amount + win.buyerPremium
              return (
                <li key={win.id} className="flex items-center gap-4 rounded-card border border-line p-4">
                  {win.thumbnail && (
                    <img src={win.thumbnail} alt="" className="h-16 w-16 rounded-card object-cover" />
                  )}
                  <div className="flex-1">
                    {win.href ? (
                      <Link to={win.href} className="font-semibold text-ink hover:text-brand-ink">
                        {win.title}
                      </Link>
                    ) : (
                      <span className="font-semibold text-ink">{win.title}</span>
                    )}
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-small text-ink-2">
                      <span>Winning bid {formatZAR(win.amount)}</span>
                      <span>Buyer's premium {formatZAR(win.buyerPremium)}</span>
                      <span className="font-semibold text-ink">Total {formatZAR(itemTotal)}</span>
                      <span>{PAYMENT_LABELS[win.status] ?? win.status}</span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          <p className="mt-4 text-small font-semibold text-ink">Total across all wins: {formatZAR(total)}</p>
        </>
      )}
    </div>
  )
}

async function loadListings(payments: Payment[]): Promise<Record<string, Listing>> {
  if (payments.length === 0) return {}
  const { data } = await supabase
    .from('listings')
    .select('*')
    .in(
      'id',
      payments.map((p) => p.listing_id),
    )
  return Object.fromEntries((data ?? []).map((l) => [l.id, l]))
}

async function loadThumbnails(payments: Payment[]): Promise<Record<string, string>> {
  if (payments.length === 0) return {}
  const { data } = await supabase
    .from('listing_images')
    .select('listing_id, storage_path')
    .in(
      'listing_id',
      payments.map((p) => p.listing_id),
    )
    .eq('position', 0)
  return Object.fromEntries((data ?? []).map((img) => [img.listing_id, getListingPhotoUrl(img.storage_path)]))
}

async function loadLots(lotPayments: LotPayment[]): Promise<Record<string, Lot>> {
  if (lotPayments.length === 0) return {}
  const { data } = await supabase
    .from('lots')
    .select('*')
    .in(
      'id',
      lotPayments.map((p) => p.lot_id),
    )
  return Object.fromEntries((data ?? []).map((l) => [l.id, l]))
}
