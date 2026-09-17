-- Keep the 10% literal below in sync with PLATFORM_FEE_PERCENT in
-- supabase/functions/paystack-create-subaccount (same convention as the existing platform_fee
-- calc). buyer_premium is a separate charge added on top of the winning bid and paid entirely by
-- the buyer — it is not deducted from the seller's payout the way platform_fee is, even though
-- both happen to be 10% today.
create or replace function public.close_ended_auctions()
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare
  r record;
begin
  for r in
    select id, current_high_bidder_id
    from public.listings
    where status = 'live' and ends_at <= now()
    for update skip locked
  loop
    if r.current_high_bidder_id is not null then
      update public.listings
      set status = 'sold', updated_at = now()
      where id = r.id;

      insert into public.payments (listing_id, buyer_id, seller_id, amount, platform_fee, buyer_premium, paystack_reference, status)
      select l.id, l.current_high_bidder_id, l.seller_id, l.current_price,
             round(l.current_price * 0.10, 2), round(l.current_price * 0.10, 2), b.paystack_reference, 'pending'
      from public.listings l
      join public.bids b on b.listing_id = l.id and b.is_winning = true
      where l.id = r.id;
    else
      update public.listings
      set status = 'ended', updated_at = now()
      where id = r.id;
    end if;
  end loop;
end;
$function$;
