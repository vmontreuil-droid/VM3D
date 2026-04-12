-- Store contact info for public/guest support submissions

alter table if exists public.tickets
  add column if not exists visitor_name text,
  add column if not exists visitor_email text;

create index if not exists idx_tickets_visitor_email on public.tickets(visitor_email);
