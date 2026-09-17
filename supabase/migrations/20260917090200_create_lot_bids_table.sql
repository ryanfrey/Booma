create table public.lot_bids (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.lots(id) on delete cascade,
  bidder_id uuid not null references public.profiles(id),
  amount numeric not null,
  phase text not null check (phase in ('prebid', 'live')),
  is_winning boolean not null default false,
  created_at timestamptz not null default now()
);

create index lot_bids_lot_id_idx on public.lot_bids(lot_id);

alter table public.lot_bids enable row level security;

-- No paystack reference/auth columns on this table (unlike the old model's bids) -- bids no
-- longer carry per-bid payment data under the saved-card charge-at-close model, so there's
-- nothing sensitive to hide at the column level; a plain public read policy is enough.
create policy "Public can view lot bids"
  on public.lot_bids for select
  using (true);

-- All writes go through place_lot_bid() (SECURITY DEFINER), never direct client inserts.
