-- Commission rate + agent fields op profiles
alter table profiles
  add column if not exists commission_rate  numeric(5,2) default 0,
  add column if not exists agent_active     boolean default true;

-- Agent_id op facturen (welke agent maakte deze factuur op)
alter table facturen
  add column if not exists agent_id uuid references profiles(id) on delete set null;

create index if not exists facturen_agent_id_idx on facturen(agent_id);

-- Klanten/projecten toewijzen aan agent
create table if not exists agent_assignments (
  id         bigserial primary key,
  agent_id   uuid not null references profiles(id) on delete cascade,
  customer_id uuid references profiles(id) on delete cascade,
  project_id  bigint references projects(id) on delete cascade,
  created_at  timestamptz default now() not null,
  constraint agent_assignment_target check (
    (customer_id is not null and project_id is null) or
    (project_id  is not null and customer_id is null)
  )
);

create index if not exists agent_assignments_agent_idx    on agent_assignments(agent_id);
create index if not exists agent_assignments_customer_idx on agent_assignments(customer_id);

-- Bijhouden van gegenereerde commissiefacturen
create table if not exists agent_commission_runs (
  id               bigserial primary key,
  agent_id         uuid not null references profiles(id) on delete cascade,
  periode          text not null,                       -- '2026-04'
  basis_bedrag     numeric(12,2) not null default 0,
  commission_rate  numeric(5,2)  not null default 0,
  commission_bedrag numeric(12,2) not null default 0,
  factuur_id       bigint references facturen(id) on delete set null,
  created_at       timestamptz default now() not null,
  unique(agent_id, periode)
);
