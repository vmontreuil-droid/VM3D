-- Machine file transfers: bestanden verstuurd van platform naar machine
create table if not exists public.machine_file_transfers (
  id bigserial primary key,
  machine_id bigint not null references public.machines(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,

  file_name text not null,
  storage_path text not null,
  file_size bigint,
  subfolder text, -- werf/project subfolder naam

  -- pending = wacht op sync, synced = tablet heeft opgehaald, failed = mislukt
  status text not null default 'pending',
  synced_at timestamptz,

  created_at timestamptz not null default now()
);

create index if not exists idx_mft_machine_id on public.machine_file_transfers(machine_id);
create index if not exists idx_mft_status on public.machine_file_transfers(status);

-- Storage bucket voor machine bestanden
insert into storage.buckets (id, name, public)
values ('machine-files', 'machine-files', false)
on conflict (id) do nothing;
