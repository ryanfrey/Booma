-- Lets the wins/cart page subscribe to postgres_changes on payments (RLS already scopes rows to
-- the buyer/seller, same as it scopes direct SELECTs — see "Buyers and sellers can view their own
-- payments" in 20260915200310_close_categories_and_payments_rls_gaps.sql).
alter publication supabase_realtime add table public.payments;
