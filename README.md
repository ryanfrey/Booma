# Booma

Household goods auction platform. React + TypeScript + Vite frontend backed by Supabase
(Postgres + Auth + Storage + Realtime), with Paystack for seller payouts and payments.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + publishable key
npm run dev
```

## Auth

Supabase Auth is wired up via `src/contexts/AuthContext.tsx`. On signup, a Postgres trigger
(`supabase/migrations/20260915191853_create_profile_on_signup.sql`) automatically creates a
matching row in `public.profiles`, using the `display_name` passed in signup metadata (falling
back to the local part of the email).

## Bidding

`src/components/BiddingPanel.tsx` shows the current price and a countdown to `ends_at`, and
places bids via the `place_bid()` Postgres RPC (row-locked to prevent race conditions), with
optimistic UI updates that roll back if the RPC call fails. Live price/bid updates come through
Supabase Realtime (`postgres_changes` on `listings` and `bids`).

## Payments — Paystack

Stripe Connect doesn't support South African-registered merchants directly; sellers there go
through **Paystack** instead (a Stripe company), which does. The plan:

- **Seller payouts**: each seller gets a Paystack *subaccount* (`profiles.paystack_subaccount_code`),
  created via the `paystack-create-subaccount` edge function from a linked SA bank account.
  Booma's platform fee is fixed server-side in that function, not client-supplied.
- **Buyer holds** (planned, not yet built): Paystack's Preauthorization API holds a bidder's card
  when they bid, and the hold is only captured if they win — via a *split* payment so the seller's
  subaccount is paid out directly, minus the platform fee.

Both `paystack-banks` and `paystack-create-subaccount` are Supabase Edge Functions (source in
`supabase/functions/`) — this keeps the Paystack secret key server-side only. They need a
`PAYSTACK_SECRET_KEY` secret set on the Supabase project:

```bash
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_...
```

## Stack

- React / TypeScript / Vite
- Supabase (Postgres + Auth + Storage + Realtime)
- Paystack (seller payouts + payments)
