import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')

interface InitializePreauthBody {
  listing_id?: string
  amount?: number
  callback_url?: string
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (!PAYSTACK_SECRET_KEY) {
    return jsonResponse({ error: 'Paystack is not configured' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401)
  }

  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user?.email) {
    return jsonResponse({ error: 'Not authenticated' }, 401)
  }

  let body: InitializePreauthBody
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const { listing_id, amount, callback_url } = body
  if (!listing_id || !amount || amount <= 0) {
    return jsonResponse({ error: 'listing_id and a positive amount are required' }, 400)
  }

  // A buyer needs to see the seller's subaccount code to preauthorize a split payment,
  // which RLS on profiles doesn't allow (users can only read their own row) — service
  // role reads are scoped to exactly what this flow needs, nothing broader.
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: listing, error: listingError } = await adminClient
    .from('listings')
    .select('id, status, ends_at, current_price, bid_increment, seller_id')
    .eq('id', listing_id)
    .single()

  if (listingError || !listing) {
    return jsonResponse({ error: 'Listing not found' }, 404)
  }

  if (listing.status !== 'live' || new Date(listing.ends_at) <= new Date()) {
    return jsonResponse({ error: 'This listing is not open for bidding' }, 422)
  }

  if (listing.seller_id === userData.user.id) {
    return jsonResponse({ error: "You can't bid on your own listing" }, 422)
  }

  const minBid = listing.current_price + listing.bid_increment
  if (amount < minBid) {
    return jsonResponse({ error: `Bid must be at least ${minBid}` }, 422)
  }

  const { data: sellerProfile } = await adminClient
    .from('profiles')
    .select('paystack_subaccount_code')
    .eq('id', listing.seller_id)
    .single()

  if (!sellerProfile?.paystack_subaccount_code) {
    return jsonResponse({ error: "This seller hasn't finished setting up payouts yet" }, 422)
  }

  const reference = `booma_${crypto.randomUUID()}`

  const paystackResponse = await fetch('https://api.paystack.co/preauthorization/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: userData.user.email,
      amount: Math.round(amount * 100),
      currency: 'ZAR',
      reference,
      subaccount: sellerProfile.paystack_subaccount_code,
      callback_url,
    }),
  })

  const paystackData = await paystackResponse.json()

  if (!paystackResponse.ok || !paystackData.status) {
    return jsonResponse({ error: paystackData.message ?? 'Paystack could not start the authorization' }, 502)
  }

  return jsonResponse({ authorization_url: paystackData.data.authorization_url, reference }, 200)
})
