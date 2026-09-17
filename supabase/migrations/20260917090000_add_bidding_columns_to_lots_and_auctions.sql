alter table public.lots
  add column current_price numeric,
  add column current_high_bidder_id uuid references public.profiles(id),
  add column reserve_price numeric,
  add column live_closes_at timestamptz;

update public.lots set current_price = starting_price where current_price is null;

alter table public.lots alter column current_price set not null;

alter table public.auctions
  add column current_lot_id uuid references public.lots(id);
