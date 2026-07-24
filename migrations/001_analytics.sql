begin;

create extension if not exists pgcrypto;

create table if not exists analytics_sessions (
  id uuid primary key,
  session_hash text not null,
  visitor_hash text not null,
  hash_key_version text not null,
  first_seen_at timestamptz not null,
  last_seen_at timestamptz not null,
  event_count integer not null default 0 check (event_count >= 0)
);

create table if not exists analytics_page_views (
  id uuid primary key default gen_random_uuid(),
  event_key uuid not null unique,
  occurred_at timestamptz not null default now(),
  page_key text not null,
  canonical_path text not null,
  page_title text not null,
  virtual_view text not null,
  referrer_hostname text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_id text,
  visitor_hash text not null,
  session_hash text not null,
  session_record_id uuid not null references analytics_sessions(id) on delete cascade,
  ip_hash text not null,
  ip_masked text,
  hash_key_version text not null,
  encrypted_ip_ciphertext bytea,
  encrypted_ip_iv bytea,
  encrypted_ip_tag bytea,
  ip_encryption_key_version text,
  user_agent_hash text not null,
  device_class text not null check (device_class in ('mobile', 'tablet', 'desktop', 'other')),
  locale text not null,
  country text,
  region text,
  is_bot boolean not null default false,
  bot_reason text,
  consent_policy_version text not null,
  dedupe_key text not null unique,
  constraint analytics_encrypted_ip_complete check (
    (
      encrypted_ip_ciphertext is null
      and encrypted_ip_iv is null
      and encrypted_ip_tag is null
      and ip_encryption_key_version is null
    )
    or
    (
      encrypted_ip_ciphertext is not null
      and encrypted_ip_iv is not null
      and encrypted_ip_tag is not null
      and ip_encryption_key_version is not null
    )
  )
);

create table if not exists analytics_daily_rollups (
  rollup_date date not null,
  page_key text not null,
  canonical_path text not null,
  human_views bigint not null default 0 check (human_views >= 0),
  bot_views bigint not null default 0 check (bot_views >= 0),
  sessions bigint not null default 0 check (sessions >= 0),
  unique_visitors bigint not null default 0 check (unique_visitors >= 0),
  unique_ips bigint not null default 0 check (unique_ips >= 0),
  latest_view_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (rollup_date, canonical_path)
);

create table if not exists analytics_rate_limits (
  scope text not null,
  key_hash text not null,
  bucket_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  expires_at timestamptz not null,
  primary key (scope, key_hash, bucket_start)
);

create table if not exists analytics_admin_sessions (
  id uuid primary key,
  token_hash text not null unique,
  csrf_token_hash text,
  admin_identity text not null,
  created_at timestamptz not null,
  last_seen_at timestamptz not null,
  expires_at timestamptz not null,
  reauthenticated_at timestamptz,
  created_ip_hash text not null,
  revoked_at timestamptz
);

create table if not exists analytics_admin_audit (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  admin_identity text not null,
  action text not null,
  target_view_id uuid,
  request_ip_hash text not null,
  result text not null
);

create index if not exists analytics_page_views_occurred_idx
  on analytics_page_views (occurred_at desc);
create index if not exists analytics_page_views_page_date_idx
  on analytics_page_views (page_key, occurred_at desc);
create index if not exists analytics_page_views_path_date_idx
  on analytics_page_views (canonical_path, occurred_at desc);
create index if not exists analytics_page_views_visitor_idx
  on analytics_page_views (visitor_hash, occurred_at desc);
create index if not exists analytics_page_views_ip_idx
  on analytics_page_views (ip_hash, occurred_at desc);
create index if not exists analytics_page_views_session_idx
  on analytics_page_views (session_hash, occurred_at desc);
create index if not exists analytics_page_views_session_record_idx
  on analytics_page_views (session_record_id, occurred_at desc);
create index if not exists analytics_page_views_dedupe_idx
  on analytics_page_views (dedupe_key);
create index if not exists analytics_page_views_human_date_idx
  on analytics_page_views (occurred_at desc, canonical_path) where is_bot = false;
create index if not exists analytics_sessions_hash_idx
  on analytics_sessions (session_hash, hash_key_version, last_seen_at desc);
create index if not exists analytics_rate_limits_expiry_idx
  on analytics_rate_limits (expires_at);
create index if not exists analytics_admin_sessions_expiry_idx
  on analytics_admin_sessions (expires_at) where revoked_at is null;
create index if not exists analytics_admin_audit_date_idx
  on analytics_admin_audit (occurred_at desc);
create index if not exists analytics_admin_audit_target_idx
  on analytics_admin_audit (target_view_id, occurred_at desc);

alter table analytics_page_views enable row level security;
alter table analytics_sessions enable row level security;
alter table analytics_daily_rollups enable row level security;
alter table analytics_rate_limits enable row level security;
alter table analytics_admin_sessions enable row level security;
alter table analytics_admin_audit enable row level security;

revoke all on analytics_page_views from public;
revoke all on analytics_sessions from public;
revoke all on analytics_daily_rollups from public;
revoke all on analytics_rate_limits from public;
revoke all on analytics_admin_sessions from public;
revoke all on analytics_admin_audit from public;

do $$
declare
  role_name text;
  table_name text;
begin
  foreach role_name in array array['anon', 'authenticated'] loop
    if exists (select 1 from pg_roles where rolname = role_name) then
      foreach table_name in array array[
        'analytics_page_views',
        'analytics_sessions',
        'analytics_daily_rollups',
        'analytics_rate_limits',
        'analytics_admin_sessions',
        'analytics_admin_audit'
      ] loop
        execute format('revoke all on table %I from %I', table_name, role_name);
      end loop;
    end if;
  end loop;
end
$$;

create or replace function analytics_guard_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' and current_setting('backer.allow_audit_retention', true) = 'on' then
    return old;
  end if;
  raise exception 'analytics_admin_audit is append-only';
end
$$;

drop trigger if exists analytics_admin_audit_immutable on analytics_admin_audit;
create trigger analytics_admin_audit_immutable
before update or delete on analytics_admin_audit
for each row execute function analytics_guard_audit_mutation();

commit;
