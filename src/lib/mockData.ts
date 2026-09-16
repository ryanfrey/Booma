// Placeholder data for the pre-Supabase-wiring build (design brief steps).
// Shapes here are illustrative of the future `auctions` / `lots` schema, not
// wired to anything real yet — that happens once real backend wiring lands.
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

const NOW = Date.now()
const hours = (n: number) => n * 60 * 60 * 1000
const minutes = (n: number) => n * 60 * 1000
const days = (n: number) => n * 24 * 60 * 60 * 1000
const iso = (offsetMs: number) => new Date(NOW + offsetMs).toISOString()

export const MOCK_AUCTIONS: MockAuction[] = [
  {
    id: 'auction-1',
    title: 'Constantia Wine Estate Clearance',
    location: 'Cape Town — collection only',
    status: 'preview',
    liveAt: iso(days(4)),
    lotCount: 120,
  },
  {
    id: 'auction-2',
    title: 'Sandton Apartment Downsize',
    location: 'Johannesburg — collection only',
    status: 'preview',
    liveAt: iso(days(6)),
    lotCount: 65,
  },
  {
    id: 'auction-3',
    title: 'Ballito Beach House',
    location: 'Durban — collection only',
    status: 'preview',
    liveAt: iso(days(9)),
    lotCount: 90,
  },
  {
    id: 'auction-4',
    title: 'Waterkloof Study',
    location: 'Pretoria — collection only',
    status: 'preview',
    liveAt: iso(days(5)),
    lotCount: 40,
  },
  {
    id: 'auction-5',
    title: 'Stellenbosch Garden Sale',
    location: 'Stellenbosch — collection only',
    status: 'preview',
    liveAt: iso(days(7)),
    lotCount: 28,
  },
]

export const MOCK_LOTS: MockLot[] = [
  {
    id: 'lot-1',
    auctionId: 'auction-1',
    lotNumber: 14,
    title: 'Mid-century oak dining table',
    imageCount: 4,
    condition: 'Good',
    location: 'Cape Town',
    currentBid: 950,
    bidCount: 12,
    endsAt: iso(minutes(45)),
    status: 'winning',
    category: 'Furniture',
    reserveMet: true,
    estimateLow: 800,
    estimateHigh: 1200,
    description:
      'Solid oak dining table from the estate’s formal dining room. Warm honey finish, tapered legs, seats six comfortably.',
    dimensions: '180cm L x 90cm W x 75cm H',
    conditionNotes: 'A few light surface scratches consistent with age and use. No structural damage; all joints solid.',
    collectionDetails: 'Collection from Constantia, Cape Town, by appointment within 7 days of the auction closing.',
  },
  {
    id: 'lot-2',
    auctionId: 'auction-2',
    lotNumber: 22,
    title: 'Retro two-door fridge, some rust on the door',
    imageCount: 3,
    condition: 'Fair',
    location: 'Johannesburg',
    currentBid: 620,
    bidCount: 7,
    endsAt: iso(minutes(18)),
    status: 'outbid',
    category: 'Appliances',
    reserveMet: false,
    estimateLow: 500,
    estimateHigh: 900,
    description: 'Working two-door fridge-freezer with a distinctive retro shape. Powers on and cools normally.',
    dimensions: '70cm W x 65cm D x 170cm H',
    conditionNotes: 'Surface rust on the lower door edge. Interior clean, seals intact, compressor runs quietly.',
    collectionDetails: 'Collection from Northcliff, Johannesburg. Buyer to arrange own transport — no delivery.',
  },
  {
    id: 'lot-3',
    auctionId: 'auction-3',
    lotNumber: 8,
    title: 'Set of 6 upholstered dining chairs',
    imageCount: 5,
    condition: 'Like new',
    location: 'Durban',
    currentBid: 1250,
    bidCount: 18,
    endsAt: iso(minutes(6)),
    category: 'Furniture',
    estimateLow: 1000,
    estimateHigh: 1800,
    description: 'Six matching dining chairs in oatmeal linen with solid wood legs. Barely used, from a show home.',
    dimensions: '48cm W x 55cm D x 90cm H (each)',
    conditionNotes: 'No visible marks or wear. Sold as a set of six.',
    collectionDetails: 'Collection from Umhlanga, Durban, or nationwide courier can be arranged at the buyer’s cost.',
  },
  {
    id: 'lot-4',
    auctionId: 'auction-4',
    lotNumber: 3,
    title: 'Antique writing desk with brass handles',
    imageCount: 4,
    condition: 'Good',
    location: 'Pretoria',
    currentBid: 0,
    soldPrice: 2100,
    bidCount: 9,
    endsAt: iso(-hours(2)),
    status: 'sold',
    category: 'Furniture',
    estimateLow: 1800,
    estimateHigh: 2500,
    description: 'Campaign-style writing desk with original brass drawer handles and a leather-inset top.',
    dimensions: '120cm W x 60cm D x 76cm H',
    conditionNotes: 'One handle has a small dent. Leather top shows light patina consistent with age.',
    collectionDetails: 'Collection from Waterkloof, Pretoria, within 7 days of the auction closing.',
  },
  {
    id: 'lot-5',
    auctionId: 'auction-1',
    lotNumber: 15,
    title: 'Scandinavian 3-seater sofa in charcoal linen',
    imageCount: 4,
    condition: 'Good',
    location: 'Cape Town',
    currentBid: 3400,
    bidCount: 21,
    endsAt: iso(hours(5)),
    category: 'Furniture',
    reserveMet: false,
    estimateLow: 3000,
    estimateHigh: 4200,
    description: 'Low-profile 3-seater sofa, charcoal linen upholstery, solid beech legs.',
    dimensions: '210cm W x 90cm D x 80cm H',
    conditionNotes: 'Light fading on the arm rests from sun exposure. Cushions retain their shape well.',
    collectionDetails: 'Collection from Constantia, Cape Town, by appointment within 7 days of the auction closing.',
  },
  {
    id: 'lot-6',
    auctionId: 'auction-2',
    lotNumber: 30,
    title: 'Cast iron gas 5-burner hob',
    imageCount: 3,
    condition: 'Good',
    location: 'Johannesburg',
    currentBid: 1800,
    bidCount: 5,
    endsAt: iso(days(2) + hours(3)),
    category: 'Appliances',
    estimateLow: 1500,
    estimateHigh: 2200,
    description: 'Freestanding 5-burner gas hob with cast iron pan supports. Removed during a kitchen renovation.',
    dimensions: '90cm W x 52cm D',
    conditionNotes: 'Light staining around the burners from normal use. All ignitors spark and burners light evenly.',
    collectionDetails: 'Collection from Northcliff, Johannesburg. Buyer to arrange own transport — no delivery.',
  },
  {
    id: 'lot-7',
    auctionId: 'auction-5',
    lotNumber: 11,
    title: 'Weber kettle braai, 57cm, well used',
    imageCount: 2,
    condition: 'Fair',
    location: 'Stellenbosch',
    currentBid: 480,
    bidCount: 3,
    endsAt: iso(days(1) + hours(6)),
    category: 'Outdoor',
    estimateLow: 400,
    estimateHigh: 700,
    description: 'Classic 57cm Weber kettle braai. Well loved, still holds heat and seals well.',
    dimensions: '57cm diameter',
    conditionNotes: 'Exterior paint worn in places, grate shows normal use. Lid seals properly, no rust-through.',
    collectionDetails: 'Collection from Stellenbosch by appointment.',
  },
  {
    id: 'lot-8',
    auctionId: 'auction-3',
    lotNumber: 40,
    title: 'Solid wood bunk bed with trundle',
    imageCount: 4,
    condition: 'Good',
    location: 'Durban',
    currentBid: 1100,
    bidCount: 6,
    endsAt: iso(days(3)),
    category: 'Furniture',
    estimateLow: 900,
    estimateHigh: 1400,
    description: 'Solid pine bunk bed with a pull-out trundle for a third sleeper. Flat-packs for transport.',
    dimensions: '200cm L x 100cm W x 160cm H',
    conditionNotes: 'Minor scuffs on the ladder rungs. All slats and fittings included.',
    collectionDetails: 'Collection from Umhlanga, Durban, or nationwide courier can be arranged at the buyer’s cost.',
  },
  {
    id: 'lot-9',
    auctionId: 'auction-4',
    lotNumber: 18,
    title: 'King-size headboard, tufted velvet',
    imageCount: 3,
    condition: 'Like new',
    location: 'Pretoria',
    currentBid: 890,
    bidCount: 4,
    endsAt: iso(hours(14)),
    category: 'Furniture',
    reserveMet: true,
    estimateLow: 700,
    estimateHigh: 1100,
    description: 'King-size tufted headboard in deep green velvet, freestanding with weighted feet.',
    dimensions: '190cm W x 130cm H',
    conditionNotes: 'No marks on the fabric. Barely used — from a spare room.',
    collectionDetails: 'Collection from Waterkloof, Pretoria, within 7 days of the auction closing.',
  },
  {
    id: 'lot-10',
    auctionId: 'auction-1',
    lotNumber: 55,
    title: '12-piece stoneware dinner set',
    imageCount: 3,
    condition: 'Like new',
    location: 'Cape Town',
    currentBid: 340,
    bidCount: 2,
    endsAt: iso(minutes(55)),
    category: 'Kitchenware',
    estimateLow: 250,
    estimateHigh: 450,
    description: '12-piece stoneware dinner set in matte white — 4 dinner plates, 4 side plates, 4 bowls.',
    dimensions: 'Dinner plate 27cm diameter',
    conditionNotes: 'No chips or cracks. Light use only, dishwasher safe.',
    collectionDetails: 'Collection from Constantia, Cape Town, by appointment within 7 days of the auction closing.',
  },
  {
    id: 'lot-11',
    auctionId: 'auction-2',
    lotNumber: 6,
    title: 'Standing floor lamp, brushed brass',
    imageCount: 2,
    condition: 'Good',
    location: 'Johannesburg',
    currentBid: 260,
    bidCount: 1,
    endsAt: iso(hours(9)),
    category: 'Decor',
    estimateLow: 200,
    estimateHigh: 350,
    description: 'Brushed brass standing lamp with a linen drum shade. Foot switch, in full working order.',
    dimensions: '35cm diameter base, 155cm H',
    conditionNotes: 'A couple of small tarnish spots on the pole. Shade is clean, no marks.',
    collectionDetails: 'Collection from Northcliff, Johannesburg. Buyer to arrange own transport — no delivery.',
  },
  {
    id: 'lot-12',
    auctionId: 'auction-3',
    lotNumber: 9,
    title: '55" LED television, no remote',
    imageCount: 3,
    condition: 'Fair',
    location: 'Durban',
    currentBid: 2200,
    bidCount: 15,
    endsAt: iso(minutes(3)),
    category: 'Electronics',
    reserveMet: true,
    estimateLow: 1800,
    estimateHigh: 2600,
    description: '55" LED television, full HD. Powers on and displays correctly. Sold without a remote.',
    dimensions: '123cm W x 71cm H',
    conditionNotes: 'Minor scuff on the lower bezel. Screen has no dead pixels or marks.',
    collectionDetails: 'Collection from Umhlanga, Durban, or nationwide courier can be arranged at the buyer’s cost.',
  },
]
