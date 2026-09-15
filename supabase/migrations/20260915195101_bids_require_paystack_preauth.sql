alter table public.bids add column paystack_reference text;
alter table public.bids add column paystack_authorization_code text;

-- Adding params via CREATE OR REPLACE would create a second, ambiguous overload
-- rather than replacing the old 3-arg function, so drop it explicitly first.
drop function if exists public.place_bid(uuid, uuid, numeric);

create function public.place_bid(
  p_listing_id uuid,
  p_bidder_id uuid,
  p_amount numeric,
  p_paystack_reference text,
  p_paystack_authorization_code text
)
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

  if p_paystack_reference is null or p_paystack_authorization_code is null then
    raise exception 'A verified payment authorization is required to bid';
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

  insert into public.bids (listing_id, bidder_id, amount, is_winning, paystack_reference, paystack_authorization_code)
  values (p_listing_id, p_bidder_id, p_amount, true, p_paystack_reference, p_paystack_authorization_code)
  returning * into v_new_bid;

  update public.listings
  set current_price = p_amount,
      current_high_bidder_id = p_bidder_id,
      updated_at = now()
  where id = p_listing_id;

  return v_new_bid;
end;
$function$;

revoke execute on function public.place_bid(uuid, uuid, numeric, text, text) from anon;
revoke execute on function public.place_bid(uuid, uuid, numeric, text, text) from public;
grant execute on function public.place_bid(uuid, uuid, numeric, text, text) to authenticated;
