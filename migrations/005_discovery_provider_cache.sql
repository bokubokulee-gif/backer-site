begin;

create table if not exists discovery_sync_runs (
  sync_run_id bigint generated always as identity primary key,
  started_at timestamptz not null,
  finished_at timestamptz,
  state text not null check (state in ('running', 'succeeded', 'partial', 'failed')),
  provider_count integer not null default 0 check (provider_count >= 0),
  creator_count integer not null default 0 check (creator_count >= 0),
  content_count integer not null default 0 check (content_count >= 0),
  metric_count integer not null default 0 check (metric_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists discovery_provider_cache (
  provider text primary key,
  schema_version integer not null default 1 check (schema_version = 1),
  provider_cursor text,
  snapshot jsonb not null default '{"creators":[],"platformIdentities":[],"contentRecords":[],"metricObservations":[]}'::jsonb,
  provider_run jsonb not null default '{}'::jsonb,
  last_success_at timestamptz,
  last_attempt_at timestamptz not null,
  updated_at timestamptz not null default now(),
  check (length(provider) between 1 and 40),
  check (jsonb_typeof(snapshot) = 'object'),
  check (jsonb_typeof(provider_run) = 'object')
);

create index if not exists discovery_sync_runs_started_at_idx
  on discovery_sync_runs (started_at desc);

commit;
