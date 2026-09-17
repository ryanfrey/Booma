alter table public.profiles
  add column payment_method_verified_at timestamptz,
  add column payment_method_card_last4 text,
  add column payment_method_card_type text;

-- Mirror the bids column-protection fix (20260915200040_fix_bid_payment_column_protection.sql):
-- revoking UPDATE from a role alone doesn't remove Postgres's default table-level grant, so it
-- has to be revoked first and re-granted only on the columns a user should self-edit. Without
-- this, any authenticated user could set their own payment_method_verified_at directly without
-- ever paying the R1 verification charge.
revoke update on public.profiles from anon, authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;
