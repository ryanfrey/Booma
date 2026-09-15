-- categories: RLS was disabled entirely, fully exposing a public lookup table
-- to writes via anon/authenticated. It's platform-managed (no seller-facing
-- "create category" flow exists), so only add read access — writes stay
-- blocked for anon/authenticated by default, service_role only.
alter table public.categories enable row level security;

create policy "Public can view categories"
  on public.categories
  for select
  using (true);

-- payments: RLS was enabled with zero policies, so nobody — not even the
-- buyer or seller involved — could read a payment via the API. Rows are only
-- ever written by close_ended_auctions()/close-auctions (SECURITY DEFINER /
-- service_role), so no INSERT/UPDATE/DELETE policy is added here either.
create policy "Buyers and sellers can view their own payments"
  on public.payments
  for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);
