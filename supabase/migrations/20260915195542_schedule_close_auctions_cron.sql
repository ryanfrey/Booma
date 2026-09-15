create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Generated server-side so no literal secret value ever lands in git; must be
-- copied out (select decrypted_secret from vault.decrypted_secrets where name
-- = 'cron_secret') and set as the CRON_SECRET edge function secret.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'cron_secret') then
    perform vault.create_secret(
      encode(gen_random_bytes(32), 'hex'),
      'cron_secret',
      'Shared secret for cron-invoked edge functions (close-auctions) — must match the CRON_SECRET edge function secret'
    );
  end if;
end $$;

select cron.schedule(
  'close-ended-auctions',
  '* * * * *',
  $cron$
  select net.http_post(
    url := 'https://glukrvgrprvnpwvnbpkp.supabase.co/functions/v1/close-auctions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $cron$
);
