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
}

export interface MockLot {
  id: string
  auctionId: string
  lotNumber: number
  title: string
  imageUrl?: string
  imageCount: number
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
  estimateLow: number
  estimateHigh: number
  description: string
  dimensions: string
  conditionNotes: string
  collectionDetails: string
}

export const CATEGORIES = ['Furniture', 'Appliances', 'Electronics', 'Kitchenware', 'Decor', 'Outdoor'] as const

export const CONDITIONS = ['Like new', 'Good', 'Fair'] as const
