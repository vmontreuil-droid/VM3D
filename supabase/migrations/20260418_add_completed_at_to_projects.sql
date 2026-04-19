-- Adds completed_at column to projects table if missing
alter table projects add column if not exists completed_at timestamp;
