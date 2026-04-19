-- Adds description column to projects table if missing
alter table projects add column if not exists description text;
