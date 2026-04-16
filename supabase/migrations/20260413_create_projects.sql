-- Maak de projects-tabel aan voor werven/projecten
create table if not exists public.projects (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  address text,
  city text,
  country text,
  latitude double precision,
  longitude double precision,
  status text default 'ingediend',
  price numeric,
  currency text default 'EUR',
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_status on public.projects(status);
create index if not exists idx_projects_created_at on public.projects(created_at desc);