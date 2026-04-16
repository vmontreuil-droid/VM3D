-- Machines tabel: kranen en bulldozers gekoppeld aan werven
create table if not exists public.machines (
  id bigserial primary key,
  project_id bigint references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,

  -- Machine info
  name text not null,                           -- bv. "CAT 320 GC"
  machine_type text not null default 'excavator', -- excavator | bulldozer
  brand text not null,                          -- CAT, HITACHI, KOMATSU, DOOSAN/DEVELON, VOLVO, LIEBHERR, HYUNDAI, KOBELCO, JCB, CASE, TAKEUCHI, KUBOTA, SANY, ZOOMLION
  model text not null,                          -- bv. "320 GC", "PC210LC-11", "DX225LC-7"
  tonnage numeric not null,                     -- bv. 22.5
  year integer,                                 -- bouwjaar

  -- Machinebesturing
  guidance_system text,                         -- UNICONTROL | TRIMBLE | TOPCON | LEICA | CHCNAV
  serial_number text,                           -- serienummer machine

  -- Connectie
  connection_code text unique not null,         -- uniek 8-char code voor connectie
  connection_password text not null,            -- wachtwoord voor remote sessie
  connection_host text,                         -- IP / hostname voor VNC
  connection_port text default '5900',
  is_online boolean default false,
  last_seen_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_machines_project_id on public.machines(project_id);
create index if not exists idx_machines_user_id on public.machines(user_id);
create index if not exists idx_machines_connection_code on public.machines(connection_code);
