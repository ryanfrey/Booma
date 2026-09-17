-- Real bidding for lots -- both the 7-day pre-bid phase and live-event bidding go through this
-- one function, distinguished by p_phase. Requires a verified payment method (a real R1 Paystack
-- charge, see paystack-verify-payment-method) rather than a per-bid preauth hold, since live
-- bidding can't tolerate a Paystack redirect on every raise -- the winner is charged once, at
-- close, against their saved card (see advance_live_auction() and the close-lot-payments edge
-- function).
create function public.place_lot_bid(
  p_lot_id uuid,
  p_bidder_id uuid,
  p_amount numeric,
  p_phase text
)
returns public.lot_bids
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_lot public.lots%rowtype;
  v_auction public.auctions%rowtype;
  v_new_bid public.lot_bids;
  v_min_bid numeric;
begin
  if auth.uid() is null or auth.uid() <> p_bidder_id then
    raise exception 'Not authorized to bid as this user';
  end if;

  if p_phase not in ('prebid', 'live') then
    raise exception 'Invalid bid phase';
  end if;

  if not exists (
    select 1 from public.profiles where id = p_bidder_id and payment_method_verified_at is not null
  ) then
    raise exception 'A verified payment method is required to bid';
  end if;

  select * into v_lot from public.lots where id = p_lot_id for update;
  if not found then
    raise exception 'Lot not found';
  end if;

  select * into v_auction from public.auctions where id = v_lot.auction_id for update;
  if not found then
    raise exception 'Auction not found';
  end if;

  if p_phase = 'prebid' then
    if v_auction.status <> 'preview' or now() >= v_auction.live_at then
      raise exception 'Pre-bidding is closed for this lot';
    end if;
  else
    if v_auction.status <> 'live' or v_auction.current_lot_id <> v_lot.id then
      raise exception 'This lot is not currently live';
    end if;
    if v_lot.live_closes_at is null or now() >= v_lot.live_closes_at then
      raise exception 'Bidding has closed for this lot';
    end if;
  end if;

  v_min_bid := public.next_min_lot_bid(v_lot.current_price);
  if p_amount < v_min_bid then
    raise exception 'Bid must be at least %', v_min_bid;
  end if;

  update public.lot_bids set is_winning = false where lot_id = p_lot_id and is_winning = true;

  insert into public.lot_bids (lot_id, bidder_id, amount, phase, is_winning)
  values (p_lot_id, p_bidder_id, p_amount, p_phase, true)
  returning * into v_new_bid;

  update public.lots
  set current_price = p_amount,
      current_high_bidder_id = p_bidder_id,
      live_closes_at = case
        when p_phase = 'live' then greatest(coalesce(live_closes_at, now()), now() + interval '15 seconds')
        else live_closes_at
      end,
      updated_at = now()
  where id = p_lot_id;

  return v_new_bid;
end;
$function$;

revoke execute on function public.place_lot_bid(uuid, uuid, numeric, text) from anon;
revoke execute on function public.place_lot_bid(uuid, uuid, numeric, text) from public;
grant execute on function public.place_lot_bid(uuid, uuid, numeric, text) to authenticated;
