-- Voeg subject en description toe aan tickets
alter table public.tickets
  add column if not exists subject text,
  add column if not exists description text;
