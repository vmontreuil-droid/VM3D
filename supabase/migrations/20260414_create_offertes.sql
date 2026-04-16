-- Offertes (prijsoffertes) tabel
create table if not exists public.offertes (
  id bigint generated always as identity primary key,
  offerte_number text not null,
  customer_id uuid references public.profiles(id) on delete set null,
  project_id bigint references public.projects(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  status text not null default 'concept' check (
    status in ('concept', 'verstuurd', 'wacht_op_klant', 'goedgekeurd', 'afgekeurd', 'verlopen')
  ),
  subject text,
  description text,
  valid_until date,
  currency text not null default 'EUR',
  vat_rate text default '21%',
  payment_terms text,
  notes text,
  subtotal numeric not null default 0,
  vat_amount numeric not null default 0,
  total numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Offerte regels (line items)
create table if not exists public.offerte_lines (
  id bigint generated always as identity primary key,
  offerte_id bigint not null references public.offertes(id) on delete cascade,
  position smallint not null default 0,
  description text not null,
  quantity numeric not null default 1,
  unit text default 'stuk',
  unit_price numeric not null default 0,
  vat_rate text default '21%',
  line_total numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_offertes_customer_id on public.offertes(customer_id);
create index if not exists idx_offertes_project_id on public.offertes(project_id);
create index if not exists idx_offertes_status on public.offertes(status);
create index if not exists idx_offertes_created_at on public.offertes(created_at desc);
create index if not exists idx_offerte_lines_offerte_id on public.offerte_lines(offerte_id);

create or replace function public.set_offertes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_offertes_updated_at on public.offertes;
create trigger trg_offertes_updated_at
before update on public.offertes
for each row
execute function public.set_offertes_updated_at();
