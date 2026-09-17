import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')

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
  if (userError || !userData.user) {
    return jsonResponse({ error: 'Not authenticated' }, 401)
  }

  let body: { reference?: string }
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  if (!body.reference) {
    return jsonResponse({ error: 'reference is required' }, 400)
  }

  const paystackResponse = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(body.reference)}`,
    { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } },
  )
  const paystackData = await paystackResponse.json()

  if (!paystackResponse.ok || !paystackData.status) {
    return jsonResponse({ error: paystackData.message ?? 'Could not verify this charge' }, 502)
  }

  const tx = paystackData.data
  if (tx.status !== 'success' || !tx.authorization?.authorization_code) {
    return jsonResponse({ error: 'Card verification was not successful', status: tx.status }, 422)
  }

  // profiles.payment_method_verified_at/card_last4/card_type are locked down to service-role-only
  // writes (see 20260917080000_add_payment_method_verification_to_profiles.sql) — this is the one
  // place that's allowed to set them, and only after Paystack itself confirms the charge succeeded.
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({
      payment_method_verified_at: new Date().toISOString(),
      payment_method_card_last4: tx.authorization.last4 ?? null,
      payment_method_card_type: tx.authorization.card_type ?? null,
    })
    .eq('id', userData.user.id)

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 500)
  }

  return jsonResponse(
    { verified: true, last4: tx.authorization.last4 ?? null, card_type: tx.authorization.card_type ?? null },
    200,
  )
})
