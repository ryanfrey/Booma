// Placeholder data for the pre-Supabase-wiring build (design brief step 2).
// Shapes here are illustrative of the future `lots` / `auctions` schema, not
// wired to anything real yet — that happens in build order step 4.
import type { LotStatus } from '../components/ui/StatusChip'

export interface MockLot {
  id: string
  title: string
  imageUrl?: string
  condition: string
  location: string
  currentBid: number
  bidCount: number
  endsAt: string
  status?: LotStatus
  soldPrice?: number
  room: string
  category: string
  auctionTitle: string
  lotNumber: number
  lotsInAuction: number
  viewerCount?: number
}

export interface MockUpcomingAuction {
  id: string
  title: string
  startsAt: string
  location: string
  lotCount: number
}

export const ROOMS = ['Living room', 'Dining', 'Bedroom', 'Kitchen', 'Outdoor', 'Kids', 'Appliances'] as const

export const CATEGORIES = ['Furniture', 'Appliances', 'Electronics', 'Kitchenware', 'Decor', 'Outdoor'] as const

export const CONDITIONS = ['Like new', 'Good', 'Fair'] as const

const NOW = Date.now()
const hours = (n: number) => n * 60 * 60 * 1000
const minutes = (n: number) => n * 60 * 1000
const days = (n: number) => n * 24 * 60 * 60 * 1000
const iso = (offsetMs: number) => new Date(NOW + offsetMs).toISOString()

export const MOCK_LOTS: MockLot[] = [
  {
    id: 'lot-1',
    title: 'Mid-century oak dining table',
    condition: 'Good',
    location: 'Cape Town',
    currentBid: 950,
    bidCount: 12,
    endsAt: iso(minutes(45)),
    status: 'winning',
    room: 'Dining',
    category: 'Furniture',
    auctionTitle: 'Southern Suburbs Estate',
    lotNumber: 14,
    lotsInAuction: 80,
  },
  {
    id: 'lot-2',
    title: 'Retro two-door fridge, some rust on the door',
    condition: 'Fair',
    location: 'Johannesburg',
    currentBid: 620,
    bidCount: 7,
    endsAt: iso(minutes(18)),
    status: 'outbid',
    room: 'Appliances',
    category: 'Appliances',
    auctionTitle: 'Northcliff Downsize',
    lotNumber: 22,
    lotsInAuction: 46,
  },
  {
    id: 'lot-3',
    title: 'Set of 6 upholstered dining chairs',
    condition: 'Like new',
    location: 'Durban',
    currentBid: 1250,
    bidCount: 18,
    endsAt: iso(minutes(6)),
    status: 'live',
    room: 'Dining',
    category: 'Furniture',
    auctionTitle: 'Umhlanga Collection',
    lotNumber: 8,
    lotsInAuction: 60,
    viewerCount: 34,
  },
  {
    id: 'lot-4',
    title: 'Antique writing desk with brass handles',
    condition: 'Good',
    location: 'Pretoria',
    currentBid: 0,
    soldPrice: 2100,
    bidCount: 9,
    endsAt: iso(-hours(2)),
    status: 'sold',
    room: 'Living room',
    category: 'Furniture',
    auctionTitle: 'Waterkloof Study',
    lotNumber: 3,
    lotsInAuction: 40,
  },
  {
    id: 'lot-5',
    title: 'Scandinavian 3-seater sofa in charcoal linen',
    condition: 'Good',
    location: 'Cape Town',
    currentBid: 3400,
    bidCount: 21,
    endsAt: iso(hours(5)),
    room: 'Living room',
    category: 'Furniture',
    auctionTitle: 'Southern Suburbs Estate',
    lotNumber: 15,
    lotsInAuction: 80,
  },
  {
    id: 'lot-6',
    title: 'Cast iron gas 5-burner hob',
    condition: 'Good',
    location: 'Johannesburg',
    currentBid: 1800,
    bidCount: 5,
    endsAt: iso(days(2) + hours(3)),
    room: 'Kitchen',
    category: 'Appliances',
    auctionTitle: 'Northcliff Downsize',
    lotNumber: 30,
    lotsInAuction: 46,
  },
  {
    id: 'lot-7',
    title: 'Weber kettle braai, 57cm, well used',
    condition: 'Fair',
    location: 'Stellenbosch',
    currentBid: 480,
    bidCount: 3,
    endsAt: iso(days(1) + hours(6)),
    room: 'Outdoor',
    category: 'Outdoor',
    auctionTitle: 'Stellenbosch Garden Sale',
    lotNumber: 11,
    lotsInAuction: 28,
  },
  {
    id: 'lot-8',
    title: 'Solid wood bunk bed with trundle',
    condition: 'Good',
    location: 'Durban',
    currentBid: 1100,
    bidCount: 6,
    endsAt: iso(days(3)),
    room: 'Kids',
    category: 'Furniture',
    auctionTitle: 'Umhlanga Collection',
    lotNumber: 40,
    lotsInAuction: 60,
  },
  {
    id: 'lot-9',
    title: 'King-size headboard, tufted velvet',
    condition: 'Like new',
    location: 'Pretoria',
    currentBid: 890,
    bidCount: 4,
    endsAt: iso(hours(14)),
    room: 'Bedroom',
    category: 'Furniture',
    auctionTitle: 'Waterkloof Study',
    lotNumber: 18,
    lotsInAuction: 40,
  },
  {
    id: 'lot-10',
    title: '12-piece stoneware dinner set',
    condition: 'Like new',
    location: 'Cape Town',
    currentBid: 340,
    bidCount: 2,
    endsAt: iso(minutes(55)),
    room: 'Kitchen',
    category: 'Kitchenware',
    auctionTitle: 'Southern Suburbs Estate',
    lotNumber: 55,
    lotsInAuction: 80,
  },
  {
    id: 'lot-11',
    title: 'Standing floor lamp, brushed brass',
    condition: 'Good',
    location: 'Johannesburg',
    currentBid: 260,
    bidCount: 1,
    endsAt: iso(hours(9)),
    room: 'Living room',
    category: 'Decor',
    auctionTitle: 'Northcliff Downsize',
    lotNumber: 6,
    lotsInAuction: 46,
  },
  {
    id: 'lot-12',
    title: '55" LED television, no remote',
    condition: 'Fair',
    location: 'Durban',
    currentBid: 2200,
    bidCount: 15,
    endsAt: iso(minutes(3)),
    status: 'live',
    room: 'Living room',
    category: 'Electronics',
    auctionTitle: 'Umhlanga Collection',
    lotNumber: 9,
    lotsInAuction: 60,
    viewerCount: 58,
  },
]

export const UPCOMING_AUCTIONS: MockUpcomingAuction[] = [
  {
    id: 'auction-1',
    title: 'Constantia Wine Estate Clearance',
    startsAt: iso(days(4)),
    location: 'Cape Town — collection only',
    lotCount: 120,
  },
  {
    id: 'auction-2',
    title: 'Sandton Apartment Downsize',
    startsAt: iso(days(6)),
    location: 'Johannesburg — collection only',
    lotCount: 65,
  },
  {
    id: 'auction-3',
    title: 'Ballito Beach House',
    startsAt: iso(days(9)),
    location: 'Durban — collection only',
    lotCount: 90,
  },
]
