-- Yifei Labs: analysis sessions + production job bank
-- Run in Supabase SQL editor (or via CLI) before enabling cloud persistence.

-- 1) Multi-step career analysis sessions (privacy: filter by client_token)
create table if not exists public.analysis_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_token text,
  source text,
  resume_text_hash text,
  resume_profile jsonb,
  structured_resume jsonb,
  job_bank_version text,
  match_result jsonb,
  gap_results jsonb not null default '[]'::jsonb,
  learning_plans jsonb not null default '[]'::jsonb,
  optimizations jsonb not null default '[]'::jsonb
);

create index if not exists analysis_sessions_client_token_idx
  on public.analysis_sessions (client_token);

create index if not exists analysis_sessions_updated_at_idx
  on public.analysis_sessions (updated_at desc);

-- 2) Shared job bank (synthetic market samples by default)
create table if not exists public.stored_jobs (
  id text primary key,
  title text not null,
  company text,
  location text,
  salary text,
  description text,
  requirements text,
  keywords text[] default '{}',
  skill_tags text[] default '{}',
  source text,
  batch_id text,
  is_synthetic boolean not null default true,
  platform_style text,
  related_directions text[] default '{}',
  seniority text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  payload jsonb
);

create index if not exists stored_jobs_title_idx on public.stored_jobs (title);
create index if not exists stored_jobs_batch_id_idx on public.stored_jobs (batch_id);

-- Optional: enable RLS and deny anon; service role bypasses RLS.
alter table public.analysis_sessions enable row level security;
alter table public.stored_jobs enable row level security;

-- No public policies: only service_role (server) should access these tables
-- until Auth + user_id RLS is introduced.

comment on table public.analysis_sessions is
  'Career analysis sessions; scope by client_token until full auth.';
comment on table public.stored_jobs is
  'Job bank rows; is_synthetic=true means market sample not live posting.';
