-- Create tickets system tables for admin/customer support follow-up

create table if not exists public.tickets (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  status text not null default 'nieuw' check (
    status in ('nieuw', 'in_behandeling', 'wacht_op_klant', 'afgerond', 'gesloten')
  ),
  priority text not null default 'normaal' check (
    priority in ('laag', 'normaal', 'hoog', 'urgent')
  ),
  customer_id uuid references public.profiles(id) on delete set null,
  project_id bigint references public.projects(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date,
  last_reply_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_messages (
  id bigint generated always as identity primary key,
  ticket_id bigint not null references public.tickets(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  message text not null,
  is_internal boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_tickets_status on public.tickets(status);
create index if not exists idx_tickets_customer_id on public.tickets(customer_id);
create index if not exists idx_tickets_project_id on public.tickets(project_id);
create index if not exists idx_tickets_created_at on public.tickets(created_at desc);
create index if not exists idx_ticket_messages_ticket_id on public.ticket_messages(ticket_id);

create or replace function public.set_tickets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tickets_updated_at on public.tickets;
create trigger trg_tickets_updated_at
before update on public.tickets
for each row
execute function public.set_tickets_updated_at();
