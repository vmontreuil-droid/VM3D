-- Cloudflare Tunnel URL voor in-browser remote view (noVNC + droidVNC-NG)
-- De tablet runt cloudflared + websockify en post zijn publieke tunnel-URL
-- naar /api/machines/tunnel met de connection_code. Admin embedt deze URL
-- in een iframe op de machine-detailpagina voor live zicht + bediening.
alter table public.machines add column if not exists tunnel_url text;
alter table public.machines add column if not exists tunnel_seen_at timestamptz;

create index if not exists idx_machines_tunnel_seen_at on public.machines(tunnel_seen_at);
