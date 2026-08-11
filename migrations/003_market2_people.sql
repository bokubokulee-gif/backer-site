begin;

create table if not exists market2_people (
  person_id text primary key,
  slug text not null unique,
  display_name text not null,
  public_description text not null default '',
  portrait_url text not null,
  portrait_source_url text,
  portrait_policy text not null default 'provider-url-refresh-required'
    check (portrait_policy in ('same-origin', 'provider-url-refresh-required', 'none')),
  category text not null default 'Creator',
  claim_status text not null default 'unclaimed'
    check (claim_status in ('unclaimed', 'claim-pending', 'claimed', 'verified', 'revoked')),
  discovery_status text not null default 'active'
    check (discovery_status in ('active', 'hidden', 'opted-out', 'removed')),
  identity_confidence text not null default 'source-account-only'
    check (identity_confidence in ('source-account-only', 'editorial-reviewed', 'creator-verified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists market2_source_accounts (
  source_account_id text primary key,
  person_id text not null references market2_people(person_id) on delete cascade,
  platform text not null check (platform in ('x', 'youtube', 'instagram', 'github')),
  native_account_id text not null,
  handle text not null,
  profile_url text not null,
  account_type text not null default 'public',
  verification_state text not null default 'unverified'
    check (verification_state in ('unverified', 'platform-verified', 'creator-verified')),
  source_policy_mode text not null default 'discovery-only'
    check (source_policy_mode in (
      'discovery-only',
      'provider-rank-raw-only',
      'known-professional-discovery',
      'creator-authorized',
      'youtube-derived-approved'
    )),
  latest_refresh_at timestamptz,
  first_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, native_account_id)
);

create table if not exists market2_content_items (
  content_id text primary key,
  person_id text not null references market2_people(person_id) on delete cascade,
  source_account_id text not null references market2_source_accounts(source_account_id) on delete cascade,
  platform text not null check (platform in ('x', 'youtube', 'instagram', 'github')),
  native_content_id text not null,
  canonical_url text not null,
  title_or_excerpt text not null default '',
  content_type text not null default 'post',
  published_at timestamptz,
  thumbnail_url text,
  thumbnail_policy text not null default 'provider-url-refresh-required'
    check (thumbnail_policy in ('same-origin', 'provider-url-refresh-required', 'embed-only', 'none')),
  availability text not null default 'available'
    check (availability in ('available', 'unavailable', 'removed')),
  observed_at timestamptz not null,
  refreshed_at timestamptz not null,
  unique (platform, native_content_id)
);

create table if not exists market2_metric_snapshots (
  snapshot_id bigint generated always as identity primary key,
  person_id text not null references market2_people(person_id) on delete cascade,
  subject_type text not null check (subject_type in ('account', 'content', 'topic', 'repository')),
  subject_id text not null,
  platform text not null check (platform in ('x', 'youtube', 'instagram', 'github')),
  metric_name text not null,
  raw_metric_value numeric,
  raw_metric_text text,
  observation_window text not null check (observation_window in ('24h', '7d', '30d', '90d', 'current', 'lifetime')),
  observed_at timestamptz not null,
  source_timestamp timestamptz,
  provider_rank integer,
  is_derived boolean not null default false,
  policy_mode text not null default 'raw-provider-metric',
  provider_payload_reference text,
  created_at timestamptz not null default now(),
  check (
    platform <> 'youtube'
    or is_derived = false
    or policy_mode = 'youtube-derived-approved'
  ),
  unique (platform, subject_type, subject_id, metric_name, observation_window, observed_at)
);

create table if not exists market2_attention_evidence (
  evidence_id bigint generated always as identity primary key,
  person_id text not null references market2_people(person_id) on delete cascade,
  observation_window text not null check (observation_window in ('24h', '7d', '30d', '90d')),
  platform_coverage jsonb not null default '[]'::jsonb,
  evidence_facts jsonb not null default '[]'::jsonb,
  coverage_gaps jsonb not null default '[]'::jsonb,
  interpretation_text text not null default '',
  confidence_grade text not null default 'low'
    check (confidence_grade in ('low', 'medium', 'high')),
  methodology_version text not null,
  cross_platform_score numeric,
  youtube_included_in_score boolean not null default false,
  youtube_policy_mode text not null default 'not-used'
    check (youtube_policy_mode in ('not-used', 'raw-provider-only', 'youtube-derived-approved')),
  generated_at timestamptz not null,
  check (
    youtube_included_in_score = false
    or youtube_policy_mode = 'youtube-derived-approved'
  )
);

create table if not exists market2_creator_consents (
  consent_record_id text primary key,
  person_id text not null references market2_people(person_id) on delete cascade,
  status text not null check (status in ('pending', 'active', 'revoked', 'expired')),
  grants_profile_publication boolean not null default false,
  grants_trading boolean not null default false,
  covered_platforms jsonb not null default '[]'::jsonb,
  evidence_reference text,
  captured_at timestamptz not null,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    status <> 'active'
    or evidence_reference is not null
  )
);

create table if not exists market2_market_eligibility (
  person_id text not null references market2_people(person_id) on delete cascade,
  instrument text not null check (instrument in ('milestones', 'pk-market', 'creator-arena', 'creator-perps')),
  status text not null default 'discovery-only'
    check (status in ('discovery-only', 'claim-pending', 'review', 'eligible', 'paused', 'denied', 'opted-out')),
  consent_record_id text references market2_creator_consents(consent_record_id),
  platform_account_verified boolean not null default false,
  right_publicity_review text not null default 'pending'
    check (right_publicity_review in ('pending', 'approved', 'rejected')),
  policy_review text not null default 'pending'
    check (policy_review in ('pending', 'approved', 'rejected')),
  settlement_source text,
  review_reference text,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (person_id, instrument),
  check (
    status <> 'eligible'
    or (
      consent_record_id is not null
      and platform_account_verified = true
      and right_publicity_review = 'approved'
      and policy_review = 'approved'
      and length(trim(coalesce(settlement_source, ''))) > 0
    )
  )
);

create table if not exists market2_sync_runs (
  sync_run_id bigint generated always as identity primary key,
  provider text not null check (provider in ('x', 'youtube', 'instagram', 'github', 'market2')),
  started_at timestamptz not null,
  completed_at timestamptz,
  status text not null check (status in (
    'running',
    'succeeded',
    'partial',
    'failed',
    'empty-window',
    'permission-required',
    'rate-limited',
    'last-good'
  )),
  people_count integer not null default 0,
  content_count integer not null default 0,
  metric_count integer not null default 0,
  rate_limit_metadata jsonb not null default '{}'::jsonb,
  diagnostic_code text,
  last_good_snapshot_reference text,
  schema_version integer not null,
  methodology_version text not null
);

create table if not exists market2_deletion_tombstones (
  tombstone_id bigint generated always as identity primary key,
  provider text not null check (provider in ('x', 'youtube', 'instagram', 'github')),
  native_object_type text not null check (native_object_type in ('account', 'content')),
  native_object_id text not null,
  removal_reason text not null,
  requested_at timestamptz not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, native_object_type, native_object_id)
);

create or replace view market2_tradable_eligibility as
select
  eligibility.person_id,
  eligibility.instrument,
  eligibility.settlement_source,
  eligibility.reviewed_at
from market2_market_eligibility eligibility
join market2_creator_consents consent
  on consent.consent_record_id = eligibility.consent_record_id
 and consent.person_id = eligibility.person_id
where eligibility.status = 'eligible'
  and eligibility.platform_account_verified = true
  and eligibility.right_publicity_review = 'approved'
  and eligibility.policy_review = 'approved'
  and length(trim(coalesce(eligibility.settlement_source, ''))) > 0
  and consent.status = 'active'
  and consent.grants_profile_publication = true
  and consent.grants_trading = true
  and (consent.expires_at is null or consent.expires_at > now());

create index if not exists market2_people_discovery_idx
  on market2_people (discovery_status, updated_at desc);

create index if not exists market2_source_accounts_platform_idx
  on market2_source_accounts (platform, latest_refresh_at desc);

create index if not exists market2_content_person_published_idx
  on market2_content_items (person_id, published_at desc);

create index if not exists market2_metrics_person_window_idx
  on market2_metric_snapshots (person_id, observation_window, observed_at desc);

create index if not exists market2_evidence_person_window_idx
  on market2_attention_evidence (person_id, observation_window, generated_at desc);

create index if not exists market2_sync_provider_started_idx
  on market2_sync_runs (provider, started_at desc);

comment on table market2_people is
  'People visible in Market 2. Official ingestion creates discovery-only records and never grants tradability.';

comment on table market2_metric_snapshots is
  'Raw provider observations. YouTube-derived metrics require the explicit youtube-derived-approved policy mode.';

comment on view market2_tradable_eligibility is
  'Fail-closed tradability view requiring active creator consent, verified platform identity, approved reviews, and a settlement source.';

commit;
