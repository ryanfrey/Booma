// Placeholder figures — the brief lists "buyer's premium % and VAT
// treatment" as an open decision (section 8). Using a common auction
// convention (10% premium, 15% VAT on the premium) purely so the UI has
// something real to compute and display. Swap these for the actual
// business terms before this goes live.
export const BUYERS_PREMIUM_RATE = 0.1
export const VAT_RATE = 0.15

export interface BidBreakdown {
  bidAmount: number
  premium: number
  vat: number
  total: number
}

export function getBidBreakdown(bidAmount: number): BidBreakdown {
  const premium = Math.round(bidAmount * BUYERS_PREMIUM_RATE)
  const vat = Math.round(premium * VAT_RATE)
  return { bidAmount, premium, vat, total: bidAmount + premium + vat }
}
