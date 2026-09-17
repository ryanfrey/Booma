import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')

// Booma's cut of every sale. Fixed server-side so a seller can't tamper with
// it via the request body — Paystack's percentage_charge is "% that goes to
// the platform's main account" on every split payment through this subaccount.
const PLATFORM_FEE_PERCENT = 10

// Called from the browser (cross-origin from the app's own domain to *.supabase.co), so every
// response needs these, and the browser's preflight OPTIONS request needs to be answered before
// it ever reaches Paystack -- without this, supabase.functions.invoke() fails with a generic
// "Failed to send a request to the Edge Function" (the browser blocks the response before the
// JS client ever sees a real HTTP status).
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } })
}

interface CreateSubaccountBody {
  business_name?: string
  settlement_bank?: string
  account_number?: string
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  if (!PAYSTACK_SECRET_KEY) {
    return jsonResponse({ error: 'Paystack is not configured' }, 500)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return jsonResponse({ error: 'Not authenticated' }, 401)
  }

  let body: CreateSubaccountBody
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  const { business_name, settlement_bank, account_number } = body
  if (!business_name || !settlement_bank || !account_number) {
    return jsonResponse({ error: 'business_name, settlement_bank, and account_number are required' }, 400)
  }

  const paystackResponse = await fetch('https://api.paystack.co/subaccount', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      business_name,
      settlement_bank,
      account_number,
      percentage_charge: PLATFORM_FEE_PERCENT,
    }),
  })

  const paystackData = await paystackResponse.json()

  if (!paystackResponse.ok || !paystackData.status) {
    return jsonResponse({ error: paystackData.message ?? 'Paystack rejected the subaccount' }, 422)
  }

  const subaccountCode = paystackData.data.subaccount_code as string

  // profiles.paystack_subaccount_code/is_seller aren't in authenticated's column-level UPDATE
  // grant (see 20260917080000_add_payment_method_verification_to_profiles.sql, which locked
  // profiles UPDATE down to just display_name/avatar_url) — this write has to go through the
  // service-role client, same as paystack-verify-payment-method's equivalent self-write.
  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ paystack_subaccount_code: subaccountCode, is_seller: true })
    .eq('id', userData.user.id)

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 500)
  }

  return jsonResponse({ subaccount_code: subaccountCode }, 200)
})
