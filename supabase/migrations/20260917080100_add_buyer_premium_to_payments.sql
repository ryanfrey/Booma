alter table public.payments
  add column buyer_premium numeric not null default 0;
