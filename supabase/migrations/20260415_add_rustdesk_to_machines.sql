-- RustDesk integratie: device ID en wachtwoord voor remote access
alter table public.machines add column if not exists rustdesk_id text;
alter table public.machines add column if not exists rustdesk_password text;
