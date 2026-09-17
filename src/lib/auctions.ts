// Data access for the real `auctions` / `lots` tables — read helpers return
// data shaped like the old MockAuction/MockLot fixtures so the existing
// public-page components didn't need to change, and admin helpers work with
// the raw DB rows directly.
import { supabase } from './supabase'
import { getLotPhotoUrl } from './storage'
import type { Tables } from './database.types'
import type { AuctionStatus, MockAuction, MockLot } from './mockData'

export type AuctionRow = Tables<'auctions'>
export type LotRow = Tables<'lots'>
export type LotImageRow = Tables<'lot_images'>

async function fetchLotImagesByLotId(lotIds: string[]): Promise<Record<string, LotImageRow[]>> {
  if (lotIds.length === 0) return {}
  const { data, error } = await supabase
    .from('lot_images')
    .select('*')
    .in('lot_id', lotIds)
    .order('position', { ascending: true })
  if (error) throw error

  const map: Record<string, LotImageRow[]> = {}
  for (const image of data ?? []) {
    ;(map[image.lot_id] ??= []).push(image)
  }
  return map
}

function toMockAuction(row: AuctionRow, lotCount: number): MockAuction {
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    status: row.status as AuctionStatus,
    liveAt: row.live_at,
    lotCount,
    currentLotId: row.current_lot_id,
  }
}

// Pre-bidding closes when the live event starts, so every lot's countdown
// is simply its auction's live_at.
function toMockLot(row: LotRow, auctionLiveAt: string, imageRows: LotImageRow[] = []): MockLot {
  const images = imageRows.map((image) => getLotPhotoUrl(image.storage_path))
  return {
    id: row.id,
    auctionId: row.auction_id,
    lotNumber: row.lot_number,
    title: row.title,
    imageUrl: images[0],
    images,
    condition: row.condition,
    location: row.location,
    currentBid: row.current_price,
    bidCount: 0,
    endsAt: auctionLiveAt,
    status: row.sold_price != null ? 'sold' : undefined,
    soldPrice: row.sold_price ?? undefined,
    category: row.category,
    reserveMet: row.reserve_met ?? undefined,
    reservePrice: row.reserve_price ?? undefined,
    liveClosesAt: row.live_closes_at,
    estimateLow: row.estimate_low,
    estimateHigh: row.estimate_high,
    description: row.description,
    dimensions: row.dimensions,
    conditionNotes: row.condition_notes,
    collectionDetails: row.collection_details,
  }
}

export async function listUpcomingAuctions(): Promise<MockAuction[]> {
  const [{ data: auctionRows, error: auctionsError }, { data: lotRows, error: lotsError }] = await Promise.all([
    supabase.from('auctions').select('*').order('live_at', { ascending: true }),
    supabase.from('lots').select('auction_id'),
  ])
  if (auctionsError) throw auctionsError
  if (lotsError) throw lotsError

  const counts = new Map<string, number>()
  for (const lot of lotRows ?? []) counts.set(lot.auction_id, (counts.get(lot.auction_id) ?? 0) + 1)

  return (auctionRows ?? []).map((row) => toMockAuction(row, counts.get(row.id) ?? 0))
}

export async function listAllLots(): Promise<MockLot[]> {
  const [{ data: auctionRows, error: auctionsError }, { data: lotRows, error: lotsError }] = await Promise.all([
    supabase.from('auctions').select('id, live_at'),
    supabase.from('lots').select('*').order('lot_number', { ascending: true }),
  ])
  if (auctionsError) throw auctionsError
  if (lotsError) throw lotsError

  const liveAtById = new Map((auctionRows ?? []).map((a) => [a.id, a.live_at]))
  const imagesByLot = await fetchLotImagesByLotId((lotRows ?? []).map((row) => row.id))
  return (lotRows ?? []).map((row) =>
    toMockLot(row, liveAtById.get(row.auction_id) ?? row.created_at, imagesByLot[row.id]),
  )
}

export async function getAuctionWithLots(auctionId: string): Promise<{ auction: MockAuction; lots: MockLot[] } | null> {
  const [{ data: auctionRow, error: auctionError }, { data: lotRows, error: lotsError }] = await Promise.all([
    supabase.from('auctions').select('*').eq('id', auctionId).maybeSingle(),
    supabase.from('lots').select('*').eq('auction_id', auctionId).order('lot_number', { ascending: true }),
  ])
  if (auctionError) throw auctionError
  if (lotsError) throw lotsError
  if (!auctionRow) return null

  const imagesByLot = await fetchLotImagesByLotId((lotRows ?? []).map((row) => row.id))
  const lots = (lotRows ?? []).map((row) => toMockLot(row, auctionRow.live_at, imagesByLot[row.id]))
  return { auction: toMockAuction(auctionRow, lots.length), lots }
}

export async function getLotWithAuction(
  lotId: string,
): Promise<{ lot: MockLot; auction: MockAuction; siblingLots: MockLot[] } | null> {
  const { data: lotRow, error: lotError } = await supabase.from('lots').select('*').eq('id', lotId).maybeSingle()
  if (lotError) throw lotError
  if (!lotRow) return null

  const result = await getAuctionWithLots(lotRow.auction_id)
  if (!result) return null

  const lot = result.lots.find((l) => l.id === lotId)
  if (!lot) return null

  return { lot, auction: result.auction, siblingLots: result.lots.filter((l) => l.id !== lotId) }
}

// --- Admin ---

export async function listAuctionsAdmin(): Promise<AuctionRow[]> {
  const { data, error } = await supabase.from('auctions').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function listAuctionsAdminWithLotCounts(): Promise<{ auction: AuctionRow; lotCount: number }[]> {
  const [auctions, { data: lotRows, error: lotsError }] = await Promise.all([
    listAuctionsAdmin(),
    supabase.from('lots').select('auction_id'),
  ])
  if (lotsError) throw lotsError

  const counts = new Map<string, number>()
  for (const lot of lotRows ?? []) counts.set(lot.auction_id, (counts.get(lot.auction_id) ?? 0) + 1)

  return auctions.map((auction) => ({ auction, lotCount: counts.get(auction.id) ?? 0 }))
}

export async function getAuctionAdmin(auctionId: string): Promise<AuctionRow | null> {
  const { data, error } = await supabase.from('auctions').select('*').eq('id', auctionId).maybeSingle()
  if (error) throw error
  return data
}

export async function listLotsAdmin(auctionId: string): Promise<LotRow[]> {
  const { data, error } = await supabase
    .from('lots')
    .select('*')
    .eq('auction_id', auctionId)
    .order('lot_number', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function listLotImagesByLotIds(lotIds: string[]): Promise<Record<string, LotImageRow[]>> {
  return fetchLotImagesByLotId(lotIds)
}

export async function listLotImages(lotId: string): Promise<LotImageRow[]> {
  const { data, error } = await supabase
    .from('lot_images')
    .select('*')
    .eq('lot_id', lotId)
    .order('position', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function addLotImage(lotId: string, storagePath: string, position: number): Promise<LotImageRow> {
  const { data, error } = await supabase
    .from('lot_images')
    .insert({ lot_id: lotId, storage_path: storagePath, position })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteLotImage(image: LotImageRow): Promise<void> {
  await supabase.storage.from('lot-photos').remove([image.storage_path])
  const { error } = await supabase.from('lot_images').delete().eq('id', image.id)
  if (error) throw error
}

export async function createAuction(input: { title: string; location: string; liveAt: string }): Promise<AuctionRow> {
  const { data, error } = await supabase
    .from('auctions')
    .insert({ title: input.title, location: input.location, live_at: input.liveAt })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export interface CreateLotInput {
  auctionId: string
  title: string
  description: string
  dimensions: string
  conditionNotes: string
  collectionDetails: string
  category: string
  condition: string
  location: string
  estimateLow: number
  estimateHigh: number
  startingPrice: number
  reservePrice?: number
}

export async function createLot(input: CreateLotInput): Promise<LotRow> {
  const { count, error: countError } = await supabase
    .from('lots')
    .select('*', { count: 'exact', head: true })
    .eq('auction_id', input.auctionId)
  if (countError) throw countError

  const { data, error } = await supabase
    .from('lots')
    .insert({
      auction_id: input.auctionId,
      lot_number: (count ?? 0) + 1,
      title: input.title,
      description: input.description,
      dimensions: input.dimensions,
      condition_notes: input.conditionNotes,
      collection_details: input.collectionDetails,
      category: input.category,
      condition: input.condition,
      location: input.location,
      estimate_low: input.estimateLow,
      estimate_high: input.estimateHigh,
      starting_price: input.startingPrice,
      current_price: input.startingPrice,
      reserve_price: input.reservePrice ?? null,
    })
    .select('*')
    .single()
  if (error) throw error
  return data
}

export interface UpdateLotInput {
  id: string
  title: string
  description: string
  dimensions: string
  conditionNotes: string
  collectionDetails: string
  category: string
  condition: string
  location: string
  estimateLow: number
  estimateHigh: number
  startingPrice: number
  reservePrice?: number
}

export async function updateLot(input: UpdateLotInput): Promise<LotRow> {
  const { data, error } = await supabase
    .from('lots')
    .update({
      title: input.title,
      description: input.description,
      dimensions: input.dimensions,
      condition_notes: input.conditionNotes,
      collection_details: input.collectionDetails,
      category: input.category,
      condition: input.condition,
      location: input.location,
      estimate_low: input.estimateLow,
      estimate_high: input.estimateHigh,
      starting_price: input.startingPrice,
      reserve_price: input.reservePrice ?? null,
    })
    .eq('id', input.id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function setAuctionStatus(auctionId: string, status: AuctionStatus): Promise<void> {
  const { error } = await supabase.from('auctions').update({ status }).eq('id', auctionId)
  if (error) throw error
}

// Opens the first lot immediately rather than waiting on a viewer's browser tick (or the pg_cron
// backstop) to happen to call this after the status flips to 'live'.
export async function advanceLiveAuction(auctionId: string): Promise<void> {
  const { error } = await supabase.rpc('advance_live_auction', { p_auction_id: auctionId })
  if (error) throw error
}
