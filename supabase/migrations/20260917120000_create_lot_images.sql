-- Multiple photos per lot, mirroring the existing listing-photos pattern
-- (Storage bucket + a join table, ordered by `position`). Lots are admin-only
-- content (see "Admins manage lots" on public.lots), so writes here follow
-- the same profiles.is_admin check rather than a per-owner check.
insert into storage.buckets (id, name, public)
values ('lot-photos', 'lot-photos', true)
on conflict (id) do nothing;

create policy "Public can view lot photos"
  on storage.objects
  for select
  using (bucket_id = 'lot-photos');

create policy "Admins manage lot photos"
  on storage.objects
  for all
  using (
    bucket_id = 'lot-photos'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin)
  )
  with check (
    bucket_id = 'lot-photos'
    and exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin)
  );

create table public.lot_images (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid not null references public.lots(id) on delete cascade,
  storage_path text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index lot_images_lot_id_idx on public.lot_images (lot_id, position);

alter table public.lot_images enable row level security;

create policy "Public can view lot images"
  on public.lot_images
  for select
  using (true);

create policy "Admins manage lot images"
  on public.lot_images
  for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.is_admin));
