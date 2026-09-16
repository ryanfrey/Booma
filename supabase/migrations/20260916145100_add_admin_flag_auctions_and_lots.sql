-- Admin flag on profiles, gating the new admin auction/lot management UI.
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Auctions: created by Booma staff, run from a warehouse. Lots within an
-- auction are open for pre-bidding immediately, then go through a live
-- session (auto-advancing lot by lot) on live_at.
create table public.auctions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null,
  status text not null default 'preview' check (status in ('preview', 'live', 'ended')),
  live_at timestamptz not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lots (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  lot_number int not null,
  title text not null,
  description text not null default '',
  dimensions text not null default '',
  condition_notes text not null default '',
  collection_details text not null default '',
  category text not null default 'Furniture',
  condition text not null default 'Good',
  location text not null default '',
  estimate_low numeric not null default 0,
  estimate_high numeric not null default 0,
  starting_price numeric not null default 0,
  reserve_met boolean,
  sold_price numeric,
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (auction_id, lot_number)
);

create index lots_auction_id_idx on public.lots(auction_id);

-- Auto-assign the next lot number within an auction when none is given.
create or replace function public.set_lot_number()
returns trigger
language plpgsql
as $$
begin
  if new.lot_number is null then
    select coalesce(max(lot_number), 0) + 1 into new.lot_number
    from public.lots
    where auction_id = new.auction_id;
  end if;
  return new;
end;
$$;

create trigger lots_set_lot_number
  before insert on public.lots
  for each row
  execute function public.set_lot_number();

alter table public.auctions enable row level security;
alter table public.lots enable row level security;

create policy "Public can view auctions"
  on public.auctions for select
  using (true);

create policy "Admins manage auctions"
  on public.auctions for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

create policy "Public can view lots"
  on public.lots for select
  using (true);

create policy "Admins manage lots"
  on public.lots for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));
