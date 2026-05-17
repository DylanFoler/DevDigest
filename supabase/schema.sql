-- DevDigest schema
-- Run this in your Supabase project: SQL Editor > New query > paste > Run

create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  github_id   text unique not null,
  github_login text not null,
  email       text,
  created_at  timestamptz default now()
);

create table if not exists repos (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references users(id) on delete cascade,
  github_repo_id text unique not null,
  owner          text not null,
  name           text not null,
  full_name      text not null,
  connected_at   timestamptz default now()
);

create table if not exists digests (
  id                    uuid primary key default gen_random_uuid(),
  repo_id               uuid not null references repos(id) on delete cascade,
  period_start          timestamptz,
  period_end            timestamptz,
  summary               text,
  pr_count              int default 0,
  merged_count          int default 0,
  open_count            int default 0,
  avg_cycle_time_hours  numeric,
  avg_review_time_hours numeric,
  pr_size_distribution  jsonb,
  stale_pr_count        int default 0,
  failed_job_names      text[] default '{}',
  release_notes         text,
  raw_data              jsonb,
  created_at            timestamptz default now()
);

-- Allow the service role full access (RLS off for service role by default,
-- but enable RLS and add policies so anon key cannot read other users data)
alter table users  enable row level security;
alter table repos  enable row level security;
alter table digests enable row level security;

-- Service role bypasses RLS automatically, so API routes work fine.
-- These policies are a safety net for any direct anon/user key usage.
do $$ begin
  create policy "service role only" on users  using (false);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service role only" on repos  using (false);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service role only" on digests using (false);
exception when duplicate_object then null; end $$;
