alter table facturen
  add column if not exists last_reminder_at timestamptz;
