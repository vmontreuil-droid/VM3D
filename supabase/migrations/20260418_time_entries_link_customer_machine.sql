-- Laat time_entries naar een klant of machine wijzen i.p.v. enkel een werf
alter table public.time_entries
  alter column project_id drop not null;

alter table public.time_entries
  add column if not exists linked_customer_id uuid references public.profiles(id) on delete set null,
  add column if not exists linked_machine_id bigint references public.machines(id) on delete set null;

create index if not exists idx_time_entries_linked_customer on public.time_entries(linked_customer_id);
create index if not exists idx_time_entries_linked_machine on public.time_entries(linked_machine_id);
