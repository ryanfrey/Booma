-- Idempotent "tick" for the live auction room. Safe to call from many places at once (every
-- viewer's browser on a ~1s interval, plus a pg_cron backstop) -- `for update skip locked` means
-- a concurrent caller that's already mid-advance just no-ops instead of double-processing.
-- Opens the first lot when a live session starts, closes the current lot once its window has
-- passed (winner = current high bidder if the reserve is met, else passed), records a pending
-- lot_payments row for a win, and advances to the next lot or ends the auction.
create function public.advance_live_auction(p_auction_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_auction public.auctions%rowtype;
  v_lot public.lots%rowtype;
  v_next_lot public.lots%rowtype;
  v_reserve_met boolean;
begin
  select * into v_auction from public.auctions where id = p_auction_id for update skip locked;
  if not found or v_auction.status <> 'live' then
    return;
  end if;

  if v_auction.current_lot_id is null then
    select * into v_next_lot from public.lots
    where auction_id = p_auction_id and sold_at is null
    order by lot_number asc
    limit 1;

    if not found then
      update public.auctions set status = 'ended', current_lot_id = null, updated_at = now() where id = p_auction_id;
      return;
    end if;

    update public.lots set live_closes_at = now() + interval '60 seconds', updated_at = now() where id = v_next_lot.id;
    update public.auctions set current_lot_id = v_next_lot.id, updated_at = now() where id = p_auction_id;
    return;
  end if;

  select * into v_lot from public.lots where id = v_auction.current_lot_id for update;
  if not found or v_lot.live_closes_at is null or now() < v_lot.live_closes_at then
    return;
  end if;

  v_reserve_met := v_lot.current_high_bidder_id is not null and v_lot.current_price >= coalesce(v_lot.reserve_price, 0);

  if v_reserve_met then
    update public.lots
    set sold_price = v_lot.current_price, sold_at = now(), reserve_met = true, live_closes_at = null, updated_at = now()
    where id = v_lot.id;

    insert into public.lot_payments (lot_id, buyer_id, amount, buyer_premium, status)
    values (v_lot.id, v_lot.current_high_bidder_id, v_lot.current_price, round(v_lot.current_price * 0.10, 2), 'pending');
  else
    update public.lots
    set reserve_met = (v_lot.current_high_bidder_id is not null), live_closes_at = null, updated_at = now()
    where id = v_lot.id;
  end if;

  select * into v_next_lot from public.lots
  where auction_id = p_auction_id and sold_at is null and id <> v_lot.id
  order by lot_number asc
  limit 1;

  if not found then
    update public.auctions set status = 'ended', current_lot_id = null, updated_at = now() where id = p_auction_id;
  else
    update public.lots set live_closes_at = now() + interval '60 seconds', updated_at = now() where id = v_next_lot.id;
    update public.auctions set current_lot_id = v_next_lot.id, updated_at = now() where id = p_auction_id;
  end if;
end;
$function$;

revoke execute on function public.advance_live_auction(uuid) from anon;
revoke execute on function public.advance_live_auction(uuid) from public;
grant execute on function public.advance_live_auction(uuid) to authenticated;
