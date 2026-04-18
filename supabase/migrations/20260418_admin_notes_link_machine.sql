-- Add machine link to admin_notes
alter table public.admin_notes
  add column if not exists linked_machine_id bigint references public.machines(id) on delete set null;

create index if not exists idx_admin_notes_linked_machine on public.admin_notes(linked_machine_id);
create index if not exists idx_admin_notes_linked_customer on public.admin_notes(linked_customer_id);
create index if not exists idx_admin_notes_linked_project on public.admin_notes(linked_project_id);
