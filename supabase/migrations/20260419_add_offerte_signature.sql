alter table offertes
  add column if not exists signature_token uuid unique,
  add column if not exists signature_data  text,
  add column if not exists signer_name     text,
  add column if not exists signed_at       timestamptz;
