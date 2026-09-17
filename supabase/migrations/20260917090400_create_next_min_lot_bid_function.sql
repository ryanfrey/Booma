-- Ports the tiered increment table from src/lib/increments.ts into SQL -- client-side-only
-- enforcement isn't safe for real money, this is the server-authoritative check place_lot_bid()
-- uses. Keep the thresholds/increments below in sync with TIERS in that file.
create or replace function public.next_min_lot_bid(p_current_price numeric)
returns numeric
language sql
immutable
set search_path = public
as $$
  select p_current_price + case
    when p_current_price <= 499 then 20
    when p_current_price <= 1999 then 50
    when p_current_price <= 9999 then 100
    else 250
  end;
$$;
