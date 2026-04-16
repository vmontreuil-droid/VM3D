import { createClient } from '@supabase/supabase-js'

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const sql = `
CREATE TABLE IF NOT EXISTS public.time_entries (
  id bigserial primary key,
  project_id bigint not null references public.projects(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  description text not null default '',
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  billable boolean not null default true,
  created_at timestamptz not null default now()
);
`

const sql2 = `CREATE INDEX IF NOT EXISTS idx_time_entries_project ON public.time_entries(project_id);`
const sql3 = `CREATE INDEX IF NOT EXISTS idx_time_entries_created_by ON public.time_entries(created_by);`
const sql4 = `ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;`
const sql5 = `CREATE POLICY "Admins can manage time entries" ON public.time_entries FOR ALL USING (true) WITH CHECK (true);`

async function main() {
  // Try exec_sql RPC first
  const { error } = await s.rpc('exec_sql', { sql })
  if (error) {
    console.log('exec_sql RPC not available:', error.message)
    console.log('')
    console.log('Please run this SQL in the Supabase SQL Editor (https://supabase.com/dashboard):')
    console.log(sql + sql2 + '\n' + sql3 + '\n' + sql4 + '\n' + sql5)
    return
  }
  
  await s.rpc('exec_sql', { sql: sql2 })
  await s.rpc('exec_sql', { sql: sql3 })
  await s.rpc('exec_sql', { sql: sql4 })
  const { error: e5 } = await s.rpc('exec_sql', { sql: sql5 })
  if (e5) console.log('Policy may already exist:', e5.message)
  
  console.log('time_entries table created successfully!')
}

main()
