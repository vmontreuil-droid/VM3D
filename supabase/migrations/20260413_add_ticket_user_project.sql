-- Voeg user_id en project_id toe aan tickets
alter table public.tickets
  add column if not exists user_id uuid references public.profiles(id) on delete set null,
  add column if not exists project_id bigint references public.projects(id) on delete set null;
