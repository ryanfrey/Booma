# Flip

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

`src/components/BiddingPanel.tsx` shows the current price and a countdown to `ends_at`. Placing a
bid requires a verified Paystack card preauthorization first (see below) — there's no optimistic
local bid until that comes back, since the bid itself only gets placed after the redirect to
Paystack's hosted checkout and back. Live price/bid updates come through Supabase Realtime
(`postgres_changes` on `listings` and `bids`, the latter restricted to non-payment columns — see
Security below).

## Listings

`src/pages/CreateListingPage.tsx` (`/sell/new`, gated to `profile.is_seller`) creates a listing as
`draft`, uploads any photos to the `listing-photos` Storage bucket
(`listings/{listingId}/{uuid}.{ext}`) and inserts matching `listing_images` rows, then flips the
listing to `live`. Photos are optional and kept in their original format (jpeg/png/webp) rather
than transcoded to webp, despite the storage path convention implying `.webp` — simpler for an
MVP, worth revisiting if consistent thumbnails matter later. A failed upload partway through
leaves the listing stuck in `draft`; there's no resume/retry flow, but `SellerDashboardPage`
(`/sell/listings`) at least surfaces stuck drafts so a seller can delete one and start over
instead of it being an invisible orphan row.

`SellerDashboardPage` also lists a seller's own listings across every status (draft/live/ended/
sold) with a thumbnail and, for sold listings, the linked payment's status — the same statuses
`close-auctions` writes to `payments.status`.

## Payments — Paystack

Stripe Connect doesn't support South African-registered merchants directly; sellers there go
through **Paystack** instead (a Stripe company), which does.

**Seller payouts**: each seller gets a Paystack *subaccount* (`profiles.paystack_subaccount_code`),
created via the `paystack-create-subaccount` edge function from a linked SA bank account (`/sell`).
Booma's platform fee (10%) is fixed server-side in that function, not client-supplied.

**Buyer holds → capture on win**:
1. `paystack-initialize-preauth` starts a Paystack Preauthorization for the bid amount, split to
   the seller's subaccount, and returns a hosted checkout URL.
2. The browser redirects there, the buyer enters their card, Paystack places a hold (no charge
   yet), and redirects back with a `reference`.
3. `paystack-verify-preauth` confirms the hold succeeded and returns the `authorization_code`.
4. Only then does the frontend call `place_bid()`, passing the reference + authorization code —
   the RPC rejects any bid without both (`bids_require_paystack_preauth` migration).
5. A `pg_cron` job (`close-ended-auctions`, every minute) calls `close_ended_auctions()`, which
   marks past-`ends_at` listings `sold` (if there's a winning bid) or `ended`, and inserts a
   `pending` `payments` row for the winner. The same cron tick then calls Paystack's
   `/preauthorization/capture` for each pending payment via the `close-auctions` edge function.

**Known gaps, not yet handled**:
- Losing bidders' preauthorized holds are never explicitly released — they rely on the card
  network's own auto-release for an uncaptured hold. If a hold expires before the auction ends,
  a bidder could win without a valid hold; capture would then fail (`payments.status = 'failed'`)
  with no retry/notification flow yet.
- The exact `/preauthorization/capture` request shape was pieced together from search-indexed
  docs, not the primary source — Paystack's docs site isn't reachable from this environment's
  network policy. **Confirm the endpoint and required params against current Paystack docs before
  relying on this in production**, ideally by running a real bid through with a Paystack test key.
- No UI surfaces `payments.status` (captured/failed) to buyers or sellers yet.

Edge functions (source in `supabase/functions/`) keep the Paystack secret key server-side only.
Required Supabase project secrets:

```bash
supabase secrets set PAYSTACK_SECRET_KEY=sk_test_...
supabase secrets set CRON_SECRET=...   # see below — must match the value in Supabase Vault
```

`close-auctions` is invoked by `pg_cron`/`pg_net` on a schedule rather than by a signed-in user, so
it checks an `x-cron-secret` header against `CRON_SECRET` instead of a JWT. The matching value is
generated server-side (never committed to git) and stored in Supabase Vault; fetch it with:

```sql
select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret';
```

## Security notes

- `place_bid()` and `close_ended_auctions()` are `SECURITY DEFINER` (they need to bypass RLS to
  insert bids / update listings / create payment rows) — both explicitly revoke `EXECUTE` from
  `anon` and lock down direct RPC access to just what's needed (`authenticated` for `place_bid`,
  `service_role` only for `close_ended_auctions`). Postgres grants `EXECUTE` to `anon`/`authenticated`
  by default on every new function, and `REVOKE ... FROM PUBLIC` alone does **not** remove that —
  revoke from the specific roles explicitly, or a security advisor pass will catch it (as one did
  here, twice).
- Same story for column-level privileges: `REVOKE SELECT (col) ON t FROM role` does **not** subtract
  from an existing table-level `SELECT` grant — you have to revoke the table-level grant and
  re-grant only the allowed columns. `bids.paystack_reference`/`paystack_authorization_code` are
  locked down this way, and the `bids` Realtime publication is restricted to non-payment columns too
  (column-level grants alone don't restrict what `postgres_changes` broadcasts).
- `categories` now has RLS enabled with a public-read policy (it's a platform-managed lookup table,
  no client-facing write path exists). `payments` now has a policy letting the buyer and seller on
  a payment read that row — nothing else (rows are only ever written by `close_ended_auctions()`/
  `close-auctions`, both privileged). `listing_images` now has RLS too: readable wherever the
  parent listing is (a public listing, or the seller's own draft), writable only by that listing's
  seller.
- `pg_net`'s extension registration landed in the `public` schema (a lint warning); it doesn't
  support `ALTER EXTENSION ... SET SCHEMA`, and its functions (`net.http_post`) already live in
  their own `net` schema regardless, so this is cosmetic — left as-is rather than risk the cron
  pipeline over a non-functional advisory.

## Stack

- React / TypeScript / Vite
- Supabase (Postgres + Auth + Storage + Realtime + pg_cron + pg_net)
- Paystack (seller payouts + payments)
