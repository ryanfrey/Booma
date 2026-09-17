-- No seller_id/platform_fee (unlike the old model's payments) -- lots belong to admin-run
-- auctions, not a third-party seller with a payout split, so the buyer's premium is the only
-- fee and it all goes to the platform.
create table public.lot_payments (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.lots(id),
  buyer_id uuid not null references public.profiles(id),
  amount numeric not null,
  buyer_premium numeric not null default 0,
  paystack_reference text,
  status text not null default 'pending' check (status in ('pending', 'processing', 'captured', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lot_payments_lot_id_idx on public.lot_payments(lot_id);
create index lot_payments_buyer_id_idx on public.lot_payments(buyer_id);

alter table public.lot_payments enable row level security;

create policy "Buyers and admins can view lot payments"
  on public.lot_payments for select
  using (
    auth.uid() = buyer_id
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin)
  );

-- No write policy -- rows are only ever written by advance_live_auction() (SECURITY DEFINER)
-- and the close-lot-payments edge function (service-role key), both of which bypass RLS.
