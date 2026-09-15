-- The previous migration's column-level REVOKE was a no-op: Postgres table-level
-- SELECT already grants every column, and revoking a column privilege doesn't
-- subtract from that — you have to revoke the table-level grant and re-grant
-- only the allowed columns.
revoke select on public.bids from anon, authenticated;
grant select (id, listing_id, bidder_id, amount, is_winning, created_at) on public.bids to anon, authenticated;
