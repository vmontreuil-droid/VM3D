const fs = require('fs');
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i > 0) env[t.substring(0,i).trim()] = t.substring(i+1).trim();
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;

(async () => {
  // Check if table exists by trying to query it
  const checkRes = await fetch(url + '/rest/v1/machine_file_transfers?select=id&limit=1', {
    headers: { Authorization: 'Bearer ' + key, apikey: key }
  });
  console.log('Table check:', checkRes.status);
  
  if (checkRes.status === 200) {
    console.log('Table already exists!');
    
    // Check if subfolder column exists
    const colCheck = await fetch(url + '/rest/v1/machine_file_transfers?select=subfolder&limit=1', {
      headers: { Authorization: 'Bearer ' + key, apikey: key }
    });
    console.log('Subfolder column:', colCheck.status === 200 ? 'exists' : 'missing');
  } else {
    console.log('Table does NOT exist. You need to run this SQL in the Supabase SQL editor:');
    console.log(`
CREATE TABLE IF NOT EXISTS public.machine_file_transfers (
  id bigserial primary key,
  machine_id bigint not null references public.machines(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  file_name text not null,
  storage_path text not null,
  file_size bigint,
  subfolder text,
  status text not null default 'pending',
  synced_at timestamptz,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS idx_mft_machine_id ON public.machine_file_transfers(machine_id);
CREATE INDEX IF NOT EXISTS idx_mft_status ON public.machine_file_transfers(status);
    `);
  }

  // Check bucket
  const bucketRes = await fetch(url + '/storage/v1/bucket/machine-files', {
    headers: { Authorization: 'Bearer ' + key, apikey: key }
  });
  console.log('Bucket:', bucketRes.status === 200 ? 'exists' : 'missing');
})();
