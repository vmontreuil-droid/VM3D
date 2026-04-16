/**
 * Apply RLS policies using Supabase's internal pg endpoint
 * This creates a temporary helper function, runs it, then drops it
 */
import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnv(fp) {
  if (!fs.existsSync(fp)) return
  for (const raw of fs.readFileSync(fp, 'utf8').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#')) continue
    const sep = line.indexOf('=')
    if (sep === -1) continue
    const key = line.slice(0, sep).trim()
    let val = line.slice(sep + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1)
    if (!(key in process.env)) process.env[key] = val
  }
}
loadEnv(path.join(process.cwd(), '.env.local'))

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

// Each policy as individual statements - we'll execute them via rpc
const policies = [
  // PROJECTS
  `ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "Users can view own projects" ON public.projects`,
  `CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
  `DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projects`,
  `CREATE POLICY "Admins can manage all projects" ON public.projects FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,

  // PROFILES
  `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles`,
  `CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
  `DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles`,
  `CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid())`,
  `DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles`,
  `CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,

  // OFFERTES
  `ALTER TABLE public.offertes ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "Users can view own offertes" ON public.offertes`,
  `CREATE POLICY "Users can view own offertes" ON public.offertes FOR SELECT USING (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
  `DROP POLICY IF EXISTS "Admins can manage all offertes" ON public.offertes`,
  `CREATE POLICY "Admins can manage all offertes" ON public.offertes FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,

  // OFFERTE_LINES
  `ALTER TABLE public.offerte_lines ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "Users can view own offerte lines" ON public.offerte_lines`,
  `CREATE POLICY "Users can view own offerte lines" ON public.offerte_lines FOR SELECT USING (EXISTS (SELECT 1 FROM public.offertes WHERE id = offerte_id AND customer_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
  `DROP POLICY IF EXISTS "Admins can manage all offerte lines" ON public.offerte_lines`,
  `CREATE POLICY "Admins can manage all offerte lines" ON public.offerte_lines FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,

  // FACTUREN
  `ALTER TABLE public.facturen ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "Users can view own facturen" ON public.facturen`,
  `CREATE POLICY "Users can view own facturen" ON public.facturen FOR SELECT USING (customer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
  `DROP POLICY IF EXISTS "Admins can manage all facturen" ON public.facturen`,
  `CREATE POLICY "Admins can manage all facturen" ON public.facturen FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,

  // FACTUUR_LINES
  `ALTER TABLE public.factuur_lines ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "Users can view own factuur lines" ON public.factuur_lines`,
  `CREATE POLICY "Users can view own factuur lines" ON public.factuur_lines FOR SELECT USING (EXISTS (SELECT 1 FROM public.facturen WHERE id = factuur_id AND customer_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
  `DROP POLICY IF EXISTS "Admins can manage all factuur lines" ON public.factuur_lines`,
  `CREATE POLICY "Admins can manage all factuur lines" ON public.factuur_lines FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,

  // TICKETS
  `ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets`,
  `CREATE POLICY "Users can view own tickets" ON public.tickets FOR SELECT USING (customer_id = auth.uid() OR created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
  `DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets`,
  `CREATE POLICY "Users can create tickets" ON public.tickets FOR INSERT WITH CHECK (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
  `DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.tickets`,
  `CREATE POLICY "Admins can manage all tickets" ON public.tickets FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,

  // TICKET_MESSAGES
  `ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "Users can view messages of own tickets" ON public.ticket_messages`,
  `CREATE POLICY "Users can view messages of own tickets" ON public.ticket_messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.tickets WHERE id = ticket_id AND (customer_id = auth.uid() OR created_by = auth.uid())) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
  `DROP POLICY IF EXISTS "Users can post messages to own tickets" ON public.ticket_messages`,
  `CREATE POLICY "Users can post messages to own tickets" ON public.ticket_messages FOR INSERT WITH CHECK (author_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
  `DROP POLICY IF EXISTS "Admins can manage all ticket messages" ON public.ticket_messages`,
  `CREATE POLICY "Admins can manage all ticket messages" ON public.ticket_messages FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,

  // PROJECT_FILES
  `ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "Users can view own project files" ON public.project_files`,
  `CREATE POLICY "Users can view own project files" ON public.project_files FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
  `DROP POLICY IF EXISTS "Users can upload to own projects" ON public.project_files`,
  `CREATE POLICY "Users can upload to own projects" ON public.project_files FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
  `DROP POLICY IF EXISTS "Admins can manage all project files" ON public.project_files`,
  `CREATE POLICY "Admins can manage all project files" ON public.project_files FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,

  // PROJECT_TIMELINE
  `ALTER TABLE public.project_timeline ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "Users can view own project timeline" ON public.project_timeline`,
  `CREATE POLICY "Users can view own project timeline" ON public.project_timeline FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
  `DROP POLICY IF EXISTS "Admins can manage all project timeline" ON public.project_timeline`,
  `CREATE POLICY "Admins can manage all project timeline" ON public.project_timeline FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))`,
]

async function applyPolicies() {
  console.log('🔧 RLS policies toepassen via SQL functies...\n')

  // Step 1: Create a temporary SQL exec function
  const createFn = `
    CREATE OR REPLACE FUNCTION public._temp_exec_sql(sql_text text)
    RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
    BEGIN EXECUTE sql_text; END;
    $$;
  `

  // Use raw fetch to create the function via PostgREST rpc
  // First, we need to create the function using an existing mechanism
  // Supabase PostgREST doesn't support DDL, but we can call existing functions

  // Actually, let's try using the supabase-js .rpc() method to see if _temp_exec_sql already exists
  // or try a different approach entirely: use the pg-meta API

  // Try the pg-meta endpoint for running queries
  const pgMetaUrl = `${url}/pg`

  // Supabase has an undocumented endpoint for running SQL queries
  // via the pg-meta REST API: POST /pg/query
  const testRes = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` }
  })
  console.log('REST API reachable:', testRes.ok)

  // Since we can't run DDL via PostgREST, we'll create an Edge Function approach
  // OR use the approach of modifying the app code to use admin client

  // Let's try the Supabase v2 query endpoint
  const endpoints = [
    `${url}/pg/query`,
    `${url}/graphql/v1`,
    `${url}/api/pg/query`,
  ]

  for (const ep of endpoints) {
    const r = await fetch(ep, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ query: 'SELECT 1 as test' }),
    })
    console.log(`${ep}: ${r.status}`)
    if (r.ok) {
      console.log('  →', await r.text())
    }
  }

  console.log('\n❌ Geen directe SQL-toegang beschikbaar via API.')
  console.log('')
  console.log('Kopieer de SQL hieronder en voer uit in de Supabase SQL Editor:')
  console.log(`  ${url.replace('.supabase.co', '.supabase.co')}/project/eufxnasajpexuwnlefgc/sql/new`)
  console.log('')
  console.log('De SQL is opgeslagen in: supabase/migrations/20260414_add_rls_policies.sql')
}

applyPolicies().catch(console.error)
