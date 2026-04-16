-- Tijdregistratie per werf
create table if not exists public.time_entries (
  id bigserial primary key,
  project_id bigint not null references public.projects(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  description text not null default '',
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer, -- computed on stop, or null while running
  billable boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_time_entries_project on public.time_entries(project_id);
create index if not exists idx_time_entries_created_by on public.time_entries(created_by);

-- RLS
alter table public.time_entries enable row level security;

create policy "Admins can manage time entries"
  on public.time_entries for all
  using (true)
  with check (true);
