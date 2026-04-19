-- Adds ready_for_payment_at column to projects table if missing
alter table projects add column if not exists ready_for_payment_at timestamp;
