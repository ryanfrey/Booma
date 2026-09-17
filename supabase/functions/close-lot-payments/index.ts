import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')
const CRON_SECRET = Deno.env.get('CRON_SECRET')

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

// Invoked on a schedule (pg_cron + pg_net), not by a signed-in user, so this function has
// verify_jwt off and checks a shared secret instead — same pattern as close-auctions.
//
// Unlike close-auctions (which captures a preauthorization hold placed at bid time), lot wins
// have no prior hold: the buyer only ever verified their card once (paystack-verify-payment-method)
// and every bid since then was a plain database write. So this charges the winner directly,
// against their saved authorization code, rather than capturing anything.
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (!CRON_SECRET || req.headers.get('x-cron-secret') !== CRON_SECRET) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  if (!PAYSTACK_SECRET_KEY) {
    return jsonResponse({ error: 'Paystack is not configured' }, 500)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Advance any live auctions whose current lot's window has passed, so a lot doesn't stay stuck
  // open forever if nobody's browser happens to be watching to trigger the tick.
  const { data: liveAuctions, error: liveAuctionsError } = await supabase
    .from('auctions')
    .select('id')
    .eq('status', 'live')

  if (liveAuctionsError) {
    return jsonResponse({ error: `Failed to list live auctions: ${liveAuctionsError.message}` }, 500)
  }

  for (const auction of liveAuctions ?? []) {
    await supabase.rpc('advance_live_auction', { p_auction_id: auction.id })
  }

  // Atomically claim pending payments before calling Paystack, so an overlapping cron run can't
  // charge the same payment twice.
  const { data: claimed, error: claimError } = await supabase
    .from('lot_payments')
    .update({ status: 'processing' })
    .eq('status', 'pending')
    .select('id, buyer_id, amount, buyer_premium')

  if (claimError) {
    return jsonResponse({ error: `Failed to claim pending payments: ${claimError.message}` }, 500)
  }

  let captured = 0
  let failed = 0

  for (const payment of claimed ?? []) {
    const { data: buyerProfile } = await supabase
      .from('profiles')
      .select('paystack_authorization_code')
      .eq('id', payment.buyer_id)
      .single()

    // charge_authorization requires the buyer's actual email (not a Paystack customer code) —
    // profiles doesn't store one, so it's read from auth.users via the admin API.
    const { data: buyerUser } = await supabase.auth.admin.getUserById(payment.buyer_id)

    if (!buyerProfile?.paystack_authorization_code || !buyerUser.user?.email) {
      await supabase.from('lot_payments').update({ status: 'failed' }).eq('id', payment.id)
      failed++
      continue
    }

    try {
      const paystackResponse = await fetch('https://api.paystack.co/transaction/charge_authorization', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authorization_code: buyerProfile.paystack_authorization_code,
          amount: Math.round((payment.amount + payment.buyer_premium) * 100),
          currency: 'ZAR',
          email: buyerUser.user.email,
        }),
      })
      const paystackData = await paystackResponse.json()
      const success = paystackResponse.ok && paystackData.status && paystackData.data?.status === 'success'

      await supabase
        .from('lot_payments')
        .update({
          status: success ? 'captured' : 'failed',
          paystack_reference: paystackData.data?.reference ?? null,
        })
        .eq('id', payment.id)

      if (success) captured++
      else failed++
    } catch {
      await supabase.from('lot_payments').update({ status: 'failed' }).eq('id', payment.id)
      failed++
    }
  }

  return jsonResponse({ captured, failed, claimed: claimed?.length ?? 0 }, 200)
})
