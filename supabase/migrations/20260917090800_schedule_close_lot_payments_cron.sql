-- Same cadence/shared-secret pattern as close-ended-auctions (20260915195542_schedule_close_auctions_cron.sql)
-- -- settlement doesn't need to be instant, a minute-level cron is consistent with how the old
-- model already works.
select cron.schedule(
  'close-lot-payments',
  '* * * * *',
  $cron$
  select net.http_post(
    url := 'https://glukrvgrprvnpwvnbpkp.supabase.co/functions/v1/close-lot-payments',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := '{}'::jsonb
  );
  $cron$
);
