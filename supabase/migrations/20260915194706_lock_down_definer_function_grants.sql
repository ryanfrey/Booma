-- REVOKE ALL ... FROM PUBLIC only strips the implicit PUBLIC-pseudo-role grant.
-- Supabase's default schema setup grants EXECUTE directly to anon/authenticated
-- on every function, and that direct grant survives CREATE OR REPLACE FUNCTION,
-- so place_bid was still callable by anon despite the earlier migration.
revoke execute on function public.place_bid(uuid, uuid, numeric) from anon;
revoke execute on function public.place_bid(uuid, uuid, numeric) from public;
grant execute on function public.place_bid(uuid, uuid, numeric) to authenticated;

-- handle_new_user() is a trigger function, only meant to be invoked by
-- on_auth_user_created — it has no business being callable directly via RPC.
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.handle_new_user() from public;
