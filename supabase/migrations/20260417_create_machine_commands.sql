-- Machine commands: afstandsbesturing van tablet (delete / move / pull / push)
create table if not exists public.machine_commands (
  id bigserial primary key,
  machine_id bigint not null references public.machines(id) on delete cascade,
  requested_by uuid references public.profiles(id) on delete set null,

  -- delete: verwijder $path op tablet
  -- move:   verplaats $path -> $new_path op tablet
  -- pull:   tablet leest $path en upload naar storage ($storage_path)
  -- push:   tablet download $storage_path uit storage en schrijft naar $path
  kind text not null check (kind in ('delete','move','pull','push')),
  path text not null,                 -- absolute pad op tablet (source)
  new_path text,                      -- doelpad op tablet (move/push)
  storage_path text,                  -- storage-object (pull-result of push-bron)
  file_name text,                     -- UI / notificatie
  file_size bigint,

  status text not null default 'pending'
    check (status in ('pending','running','done','failed')),
  error text,

  created_at timestamptz not null default now(),
  executed_at timestamptz
);

create index if not exists idx_mcmd_machine_status
  on public.machine_commands(machine_id, status);

alter table public.machine_commands enable row level security;

-- Admins volledige toegang
drop policy if exists mcmd_admin_all on public.machine_commands;
create policy mcmd_admin_all on public.machine_commands
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Eigenaar van de machine mag zijn commands zien en maken
drop policy if exists mcmd_owner_select on public.machine_commands;
create policy mcmd_owner_select on public.machine_commands
  for select to authenticated
  using (exists (select 1 from public.machines m where m.id = machine_id and m.user_id = auth.uid()));

drop policy if exists mcmd_owner_insert on public.machine_commands;
create policy mcmd_owner_insert on public.machine_commands
  for insert to authenticated
  with check (exists (select 1 from public.machines m where m.id = machine_id and m.user_id = auth.uid()));
