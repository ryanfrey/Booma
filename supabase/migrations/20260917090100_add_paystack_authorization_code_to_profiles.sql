-- Reusable Paystack authorization code from the R1 payment-method verification charge, needed
-- to charge lot winners directly (charge_authorization) at close time instead of a per-bid
-- redirect-and-hold flow -- rapid live bidding can't tolerate bouncing to Paystack on every raise.
-- No grant needed for anon/authenticated: table-level UPDATE on profiles was already revoked and
-- only re-granted on display_name/avatar_url (20260917080000_add_payment_method_verification_to_profiles.sql)
-- -- a newly added column carries no privileges to those roles by default, so this is already
-- service-role-write-only, same as the other payment_method_* columns.
alter table public.profiles
  add column paystack_authorization_code text;
