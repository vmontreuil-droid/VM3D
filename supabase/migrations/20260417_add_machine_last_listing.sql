-- Store the most recent directory listing reported by the tablet
-- so the web UI can show what's actually on the machine.
alter table public.machines
  add column if not exists last_listing jsonb,
  add column if not exists last_listing_at timestamptz;
