// Shared shapes for auctions/lots (backed by the real `auctions` / `lots`
// tables — see src/lib/auctions.ts) plus the fixed category/condition lists
// used by both the public filter panel and the admin lot form.
import type { LotStatus } from '../components/ui/StatusChip'

export type AuctionStatus = 'preview' | 'live' | 'ended'

export interface MockAuction {
  id: string
  title: string
  location: string
  status: AuctionStatus
  /** When the live event starts (or started, for 'live'/'ended' auctions). */
  liveAt: string
  lotCount: number
  /** Which lot the live room is currently calling — null when not live. */
  currentLotId: string | null
}

export interface MockLot {
  id: string
  auctionId: string
  lotNumber: number
  title: string
  /** First photo, if any — used by card/thumbnail views. */
  imageUrl?: string
  /** All photos in display order — used by the lot detail page's gallery. */
  images: string[]
  condition: string
  location: string
  currentBid: number
  bidCount: number
  endsAt: string
  status?: LotStatus
  soldPrice?: number
  category: string
  viewerCount?: number
  /** undefined = no reserve on this lot. */
  reserveMet?: boolean
  /** The reserve amount itself, if one is set — undefined = no reserve. */
  reservePrice?: number
  /** Set only while this lot is the one currently being called live; extends on each live bid. */
  liveClosesAt?: string | null
  estimateLow: number
  estimateHigh: number
  description: string
  dimensions: string
  conditionNotes: string
  collectionDetails: string
}

export const CATEGORIES = ['Furniture', 'Appliances', 'Electronics', 'Kitchenware', 'Decor', 'Outdoor'] as const

export const CONDITIONS = ['Like new', 'Good', 'Fair'] as const
