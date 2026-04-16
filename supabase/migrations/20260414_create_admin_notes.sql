-- Notities voor admin dashboard
create table if not exists public.admin_notes (
  id bigserial primary key,
  created_by uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  linked_customer_id uuid references public.profiles(id) on delete set null,
  linked_project_id bigint references public.projects(id) on delete set null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_notes_created_by on public.admin_notes(created_by);

-- RLS
alter table public.admin_notes enable row level security;

create policy "Admins can manage notes"
  on public.admin_notes for all
  using (true)
  with check (true);
