-- Run this in Supabase → SQL Editor → New query, then Run.
-- Enables shared map state for all visitors (anon read/write — tighten for production).

create table if not exists public.map_state (
  id text primary key default 'default',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Seed row so first client load can succeed; app upserts the same id.
insert into public.map_state (id, data)
values (
  'default',
  '{"layers":[],"devices":[],"floorPlanDataUrl":null}'::jsonb
)
on conflict (id) do nothing;

alter table public.map_state enable row level security;

-- Open policies: anyone with the anon key can read/write (typical for a small shared map).
-- Replace with stricter policies + Auth if you need per-user data.
create policy "map_state_select" on public.map_state
  for select using (true);

create policy "map_state_insert" on public.map_state
  for insert with check (true);

create policy "map_state_update" on public.map_state
  for update using (true);
