import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')

// Booma's cut of every sale. Fixed server-side so a seller can't tamper with
// it via the request body — Paystack's percentage_charge is "% that goes to
// the platform's main account" on every split payment through this subaccount.
const PLATFORM_FEE_PERCENT = 10

interface CreateSubaccountBody {
  business_name?: string
  settlement_bank?: string
  account_number?: string
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (!PAYSTACK_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Paystack is not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: CreateSubaccountBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { business_name, settlement_bank, account_number } = body
  if (!business_name || !settlement_bank || !account_number) {
    return new Response(
      JSON.stringify({ error: 'business_name, settlement_bank, and account_number are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    )
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
    return new Response(
      JSON.stringify({ error: paystackData.message ?? 'Paystack rejected the subaccount' }),
      { status: 422, headers: { 'Content-Type': 'application/json' } },
    )
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
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ subaccount_code: subaccountCode }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
