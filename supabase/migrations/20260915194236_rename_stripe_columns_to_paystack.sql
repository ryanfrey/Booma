-- Switching payment processors: Stripe Connect doesn't support South African
-- sellers directly (no native SA merchant accounts). Paystack (Stripe-owned)
-- does, via Subaccounts + the Preauthorization API. Rename the placeholder
-- Stripe columns to their Paystack equivalents.
alter table public.profiles rename column stripe_customer_id to paystack_customer_code;
alter table public.profiles rename column stripe_connect_account_id to paystack_subaccount_code;
alter table public.payments rename column stripe_payment_intent_id to paystack_reference;
