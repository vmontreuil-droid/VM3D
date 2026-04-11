-- Add customer bank details fields to profiles
-- Run this in the Supabase SQL Editor or with the Supabase CLI.

alter table public.profiles
  add column if not exists iban text,
  add column if not exists bic text,
  add column if not exists logo_path text;

comment on column public.profiles.iban is 'Customer IBAN used for invoicing and payment details';
comment on column public.profiles.bic is 'Customer BIC/SWIFT code used for invoicing and payment details';
comment on column public.profiles.logo_path is 'Storage path for the uploaded customer logo';
