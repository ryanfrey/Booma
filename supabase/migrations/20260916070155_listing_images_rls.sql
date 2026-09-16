-- listing_images had RLS enabled with zero policies (nobody could read/write
-- it via the API, including a listing's own seller). Mirror listings'
-- visibility: readable wherever the parent listing is (public listing or the
-- seller's own draft), writable only by the listing's seller.
create policy "View images for visible listings"
  on public.listing_images
  for select
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id
        and (l.status in ('live', 'ended', 'sold') or l.seller_id = auth.uid())
    )
  );

create policy "Sellers manage their listing images"
  on public.listing_images
  for all
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id and l.seller_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.listings l
      where l.id = listing_images.listing_id and l.seller_id = auth.uid()
    )
  );
