// Tiered bid increment table (design brief section 4). Hardcoded for the
// mock-data build order phase — "Load it from the database" per the brief
// is build order step 4's job, once an `increments` table exists.
const TIERS: { upTo: number; increment: number }[] = [
  { upTo: 499, increment: 20 },
  { upTo: 1999, increment: 50 },
  { upTo: 9999, increment: 100 },
  { upTo: Infinity, increment: 250 },
]

export function getIncrement(currentBid: number): number {
  return TIERS.find((tier) => currentBid <= tier.upTo)!.increment
}

export function getNextMinBid(currentBid: number): number {
  return currentBid + getIncrement(currentBid)
}
