-- "Public can view bids" (select, qual: true) exposes every column, including
-- paystack_reference/paystack_authorization_code, to anon and authenticated —
-- both via direct REST/SQL reads and via the Realtime postgres_changes
-- broadcast, which sends full rows regardless of column-level grants. Neither
-- value is independently chargeable without our Paystack secret key, but
-- there's no reason to expose payment plumbing to every visitor.
--
-- NOTE: this specific REVOKE turned out to be a no-op — see
-- fix_bid_payment_column_protection, which corrects it. Kept as-is (rather
-- than folded together) so the migration history matches what was actually
-- applied.
revoke select (paystack_reference, paystack_authorization_code) on public.bids from anon, authenticated;

alter publication supabase_realtime set table public.bids (id, listing_id, bidder_id, amount, is_winning, created_at);
