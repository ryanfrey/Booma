-- place_bid must run as SECURITY DEFINER so it can insert into bids / update listings
-- despite RLS (bids has no INSERT policy, listings UPDATE is seller-only) — otherwise
-- every bid attempt from an authenticated, non-seller user fails. Guard against a caller
-- spoofing p_bidder_id now that the function bypasses RLS.
create or replace function public.place_bid(p_listing_id uuid, p_bidder_id uuid, p_amount numeric)
returns bids
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_listing public.listings%rowtype;
  v_new_bid public.bids;
begin
  if auth.uid() is null or auth.uid() <> p_bidder_id then
    raise exception 'Not authorized to bid as this user';
  end if;

  select * into v_listing
  from public.listings
  where id = p_listing_id
  for update;

  if not found then
    raise exception 'Listing not found';
  end if;

  if v_listing.status <> 'live' then
    raise exception 'Listing is not open for bidding';
  end if;

  if now() > v_listing.ends_at then
    raise exception 'Auction has already ended';
  end if;

  if v_listing.seller_id = p_bidder_id then
    raise exception 'Sellers cannot bid on their own listing';
  end if;

  if p_amount < v_listing.current_price + v_listing.bid_increment then
    raise exception 'Bid must be at least %', v_listing.current_price + v_listing.bid_increment;
  end if;

  update public.bids
  set is_winning = false
  where listing_id = p_listing_id and is_winning = true;

  insert into public.bids (listing_id, bidder_id, amount, is_winning)
  values (p_listing_id, p_bidder_id, p_amount, true)
  returning * into v_new_bid;

  update public.listings
  set current_price = p_amount,
      current_high_bidder_id = p_bidder_id,
      updated_at = now()
  where id = p_listing_id;

  return v_new_bid;
end;
$function$;

revoke all on function public.place_bid(uuid, uuid, numeric) from public;
grant execute on function public.place_bid(uuid, uuid, numeric) to authenticated;
