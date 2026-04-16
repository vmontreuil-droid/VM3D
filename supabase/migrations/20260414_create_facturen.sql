-- Facturen tabel
create table if not exists public.facturen (
  id bigint generated always as identity primary key,
  factuur_number text not null,
  offerte_id bigint references public.offertes(id) on delete set null,
  customer_id uuid references public.profiles(id) on delete set null,
  project_id bigint references public.projects(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  status text not null default 'concept' check (
    status in ('concept', 'verstuurd', 'betaald', 'vervallen', 'gecrediteerd')
  ),
  subject text,
  description text,
  due_date date,
  currency text not null default 'EUR',
  vat_rate text default '21%',
  payment_terms text,
  notes text,
  subtotal numeric not null default 0,
  vat_amount numeric not null default 0,
  total numeric not null default 0,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Factuur regels (line items)
create table if not exists public.factuur_lines (
  id bigint generated always as identity primary key,
  factuur_id bigint not null references public.facturen(id) on delete cascade,
  position smallint not null default 0,
  description text not null,
  quantity numeric not null default 1,
  unit text default 'stuk',
  unit_price numeric not null default 0,
  vat_rate text default '21%',
  line_total numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_facturen_customer_id on public.facturen(customer_id);
create index if not exists idx_facturen_project_id on public.facturen(project_id);
create index if not exists idx_facturen_offerte_id on public.facturen(offerte_id);
create index if not exists idx_facturen_status on public.facturen(status);
create index if not exists idx_facturen_created_at on public.facturen(created_at desc);
create index if not exists idx_factuur_lines_factuur_id on public.factuur_lines(factuur_id);

create or replace function public.set_facturen_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_facturen_updated_at on public.facturen;
create trigger trg_facturen_updated_at
before update on public.facturen
for each row
execute function public.set_facturen_updated_at();
