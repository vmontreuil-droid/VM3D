-- Machine location (reported by tablet via termux-location)
alter table public.machines
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_accuracy double precision,
  add column if not exists location_updated_at timestamptz;

create index if not exists machines_location_updated_at_idx
  on public.machines(location_updated_at desc);
