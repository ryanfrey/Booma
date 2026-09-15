# Booma

Household goods auction platform. React + TypeScript + Vite frontend backed by Supabase
(Postgres + Auth + Storage + Realtime), with Stripe Connect for payments (planned).

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + publishable key
npm run dev
```

## Auth

Supabase Auth is wired up via `src/contexts/AuthContext.tsx`. On signup, a Postgres trigger
(`supabase/migrations/20260915191853_create_profile_on_signup.sql`) automatically creates a
matching row in `public.profiles`, using the `display_name` passed in signup metadata (falling
back to the local part of the email).

## Stack

- React / TypeScript / Vite
- Supabase (Postgres + Auth + Storage + Realtime)
- Stripe (payments, planned)
