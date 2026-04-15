-- Per-user map state + legacy rename. Run in Supabase SQL Editor after 001_map_state.sql.
-- Renames the old shared table (if present) so backups can still be queried as map_state_shared_legacy.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'map_state'
  ) then
    alter table public.map_state rename to map_state_shared_legacy;
  end if;
end $$;

create table if not exists public.user_map_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_map_state enable row level security;

create policy "user_map_state_select_own" on public.user_map_state
  for select using (auth.uid() = user_id);

create policy "user_map_state_insert_own" on public.user_map_state
  for insert with check (auth.uid() = user_id);

create policy "user_map_state_update_own" on public.user_map_state
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
