// Placeholder data for the pre-Supabase-wiring build (design brief step 2).
// Shapes here are illustrative of the future `lots` / `auctions` schema, not
// wired to anything real yet — that happens in build order step 4.
import type { LotStatus } from '../components/ui/StatusChip'

export interface MockLot {
  id: string
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
  room: string
  category: string
  auctionTitle: string
  lotNumber: number
  lotsInAuction: number
  viewerCount?: number
  /** undefined = no reserve on this lot. */
  reserveMet?: boolean
  description: string
  dimensions: string
  conditionNotes: string
  collectionDetails: string
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
    imageCount: 4,
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
    reserveMet: true,
    description:
      'Solid oak dining table from the estate’s formal dining room. Warm honey finish, tapered legs, seats six comfortably.',
    dimensions: '180cm L x 90cm W x 75cm H',
    conditionNotes: 'A few light surface scratches consistent with age and use. No structural damage; all joints solid.',
    collectionDetails: 'Collection from Constantia, Cape Town, by appointment within 7 days of the auction closing.',
  },
  {
    id: 'lot-2',
    title: 'Retro two-door fridge, some rust on the door',
    imageCount: 3,
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
    reserveMet: false,
    description: 'Working two-door fridge-freezer with a distinctive retro shape. Powers on and cools normally.',
    dimensions: '70cm W x 65cm D x 170cm H',
    conditionNotes: 'Surface rust on the lower door edge. Interior clean, seals intact, compressor runs quietly.',
    collectionDetails: 'Collection from Northcliff, Johannesburg. Buyer to arrange own transport — no delivery.',
  },
  {
    id: 'lot-3',
    title: 'Set of 6 upholstered dining chairs',
    imageCount: 5,
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
    description: 'Six matching dining chairs in oatmeal linen with solid wood legs. Barely used, from a show home.',
    dimensions: '48cm W x 55cm D x 90cm H (each)',
    conditionNotes: 'No visible marks or wear. Sold as a set of six.',
    collectionDetails: 'Collection from Umhlanga, Durban, or nationwide courier can be arranged at the buyer’s cost.',
  },
  {
    id: 'lot-4',
    title: 'Antique writing desk with brass handles',
    imageCount: 4,
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
    description: 'Campaign-style writing desk with original brass drawer handles and a leather-inset top.',
    dimensions: '120cm W x 60cm D x 76cm H',
    conditionNotes: 'One handle has a small dent. Leather top shows light patina consistent with age.',
    collectionDetails: 'Collection from Waterkloof, Pretoria, within 7 days of the auction closing.',
  },
  {
    id: 'lot-5',
    title: 'Scandinavian 3-seater sofa in charcoal linen',
    imageCount: 4,
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
    reserveMet: false,
    description: 'Low-profile 3-seater sofa, charcoal linen upholstery, solid beech legs.',
    dimensions: '210cm W x 90cm D x 80cm H',
    conditionNotes: 'Light fading on the arm rests from sun exposure. Cushions retain their shape well.',
    collectionDetails: 'Collection from Constantia, Cape Town, by appointment within 7 days of the auction closing.',
  },
  {
    id: 'lot-6',
    title: 'Cast iron gas 5-burner hob',
    imageCount: 3,
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
    description: 'Freestanding 5-burner gas hob with cast iron pan supports. Removed during a kitchen renovation.',
    dimensions: '90cm W x 52cm D',
    conditionNotes: 'Light staining around the burners from normal use. All ignitors spark and burners light evenly.',
    collectionDetails: 'Collection from Northcliff, Johannesburg. Buyer to arrange own transport — no delivery.',
  },
  {
    id: 'lot-7',
    title: 'Weber kettle braai, 57cm, well used',
    imageCount: 2,
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
    description: 'Classic 57cm Weber kettle braai. Well loved, still holds heat and seals well.',
    dimensions: '57cm diameter',
    conditionNotes: 'Exterior paint worn in places, grate shows normal use. Lid seals properly, no rust-through.',
    collectionDetails: 'Collection from Stellenbosch by appointment.',
  },
  {
    id: 'lot-8',
    title: 'Solid wood bunk bed with trundle',
    imageCount: 4,
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
    description: 'Solid pine bunk bed with a pull-out trundle for a third sleeper. Flat-packs for transport.',
    dimensions: '200cm L x 100cm W x 160cm H',
    conditionNotes: 'Minor scuffs on the ladder rungs. All slats and fittings included.',
    collectionDetails: 'Collection from Umhlanga, Durban, or nationwide courier can be arranged at the buyer’s cost.',
  },
  {
    id: 'lot-9',
    title: 'King-size headboard, tufted velvet',
    imageCount: 3,
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
    reserveMet: true,
    description: 'King-size tufted headboard in deep green velvet, freestanding with weighted feet.',
    dimensions: '190cm W x 130cm H',
    conditionNotes: 'No marks on the fabric. Barely used — from a spare room.',
    collectionDetails: 'Collection from Waterkloof, Pretoria, within 7 days of the auction closing.',
  },
  {
    id: 'lot-10',
    title: '12-piece stoneware dinner set',
    imageCount: 3,
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
    description: '12-piece stoneware dinner set in matte white — 4 dinner plates, 4 side plates, 4 bowls.',
    dimensions: 'Dinner plate 27cm diameter',
    conditionNotes: 'No chips or cracks. Light use only, dishwasher safe.',
    collectionDetails: 'Collection from Constantia, Cape Town, by appointment within 7 days of the auction closing.',
  },
  {
    id: 'lot-11',
    title: 'Standing floor lamp, brushed brass',
    imageCount: 2,
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
    description: 'Brushed brass standing lamp with a linen drum shade. Foot switch, in full working order.',
    dimensions: '35cm diameter base, 155cm H',
    conditionNotes: 'A couple of small tarnish spots on the pole. Shade is clean, no marks.',
    collectionDetails: 'Collection from Northcliff, Johannesburg. Buyer to arrange own transport — no delivery.',
  },
  {
    id: 'lot-12',
    title: '55" LED television, no remote',
    imageCount: 3,
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
    reserveMet: true,
    description: '55" LED television, full HD. Powers on and displays correctly. Sold without a remote.',
    dimensions: '123cm W x 71cm H',
    conditionNotes: 'Minor scuff on the lower bezel. Screen has no dead pixels or marks.',
    collectionDetails: 'Collection from Umhlanga, Durban, or nationwide courier can be arranged at the buyer’s cost.',
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
