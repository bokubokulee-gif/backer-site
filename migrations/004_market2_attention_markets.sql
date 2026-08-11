begin;

create table if not exists market2_identity_links (
  identity_link_id text primary key,
  person_id text not null references market2_people(person_id) on delete cascade,
  platform text not null check (platform in ('x', 'youtube', 'instagram', 'github')),
  native_account_id text not null,
  normalized_handle text,
  profile_url text not null,
  link_confidence text not null
    check (link_confidence in ('source_only', 'editorial_reviewed', 'creator_verified')),
  review_state text not null default 'pending'
    check (review_state in ('pending', 'approved', 'rejected', 'split', 'removed')),
  reviewed_by text,
  reviewed_at timestamptz,
  creator_consent_id text references market2_creator_consents(consent_record_id),
  evidence_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, native_account_id),
  check (
    review_state <> 'approved'
    or (
      reviewed_at is not null
      and length(trim(coalesce(reviewed_by, ''))) > 0
      and link_confidence in ('editorial_reviewed', 'creator_verified')
    )
  ),
  check (
    link_confidence <> 'creator_verified'
    or creator_consent_id is not null
  )
);

create table if not exists market2_provider_observations (
  observation_id bigint generated always as identity primary key,
  sync_run_id bigint references market2_sync_runs(sync_run_id) on delete set null,
  person_id text not null references market2_people(person_id) on delete cascade,
  account_id text references market2_source_accounts(source_account_id) on delete set null,
  content_id text references market2_content_items(content_id) on delete set null,
  provider text not null check (provider in ('x', 'youtube', 'instagram', 'github')),
  subject_type text not null check (subject_type in ('account', 'content', 'topic', 'repository')),
  subject_id text not null,
  metric_key text not null,
  native_metric_name text not null,
  label text not null,
  unit text not null default 'count',
  metric_kind text not null default 'counter'
    check (metric_kind in ('counter', 'gauge', 'rank', 'ratio', 'boolean')),
  raw_value numeric,
  raw_text text,
  observation_window text not null
    check (observation_window in ('24h', '7d', '30d', '90d', 'current', 'lifetime')),
  availability text not null
    check (availability in ('available', 'not_returned', 'unsupported', 'permission_required', 'removed')),
  access_class text not null
    check (access_class in ('public_app', 'known_professional', 'creator_authorized', 'unsupported', 'not_returned')),
  consent_record_id text references market2_creator_consents(consent_record_id),
  provider_timestamp timestamptz,
  observed_at timestamptz not null,
  fetched_at timestamptz not null,
  fresh_until timestamptz not null,
  stale_at timestamptz not null,
  expires_at timestamptz,
  source_url text not null,
  policy_version text not null,
  provider_rank integer,
  is_derived boolean not null default false,
  policy_mode text not null default 'raw-provider-metric',
  eligible_for_cross_platform_score boolean not null default false,
  raw_hash text not null unique,
  created_at timestamptz not null default now(),
  check (fresh_until <= stale_at),
  check (expires_at is null or stale_at <= expires_at),
  check (
    availability = 'available'
    or (raw_value is null and raw_text is null)
  ),
  check (
    access_class <> 'creator_authorized'
    or availability <> 'available'
    or consent_record_id is not null
  ),
  check (
    provider <> 'youtube'
    or eligible_for_cross_platform_score = false
  ),
  check (
    provider <> 'youtube'
    or is_derived = false
    or policy_mode = 'youtube-derived-approved'
  )
);

create table if not exists market2_metric_rollups (
  rollup_id text primary key,
  person_id text not null references market2_people(person_id) on delete cascade,
  provider text not null check (provider in ('x', 'youtube', 'instagram', 'github')),
  subject_type text not null check (subject_type in ('account', 'content', 'topic', 'repository')),
  subject_id text not null,
  metric_key text not null,
  native_metric_name text not null,
  observation_window text not null check (observation_window in ('24h', '7d', '30d', '90d')),
  effective_start timestamptz,
  effective_end timestamptz,
  current_value numeric,
  baseline_value numeric,
  absolute_delta numeric,
  percent_delta numeric,
  sample_count integer not null default 0 check (sample_count >= 0),
  coverage_ratio numeric not null default 0 check (coverage_ratio >= 0 and coverage_ratio <= 1),
  state text not null
    check (state in ('complete', 'partial', 'newly_observed', 'stale_snapshot', 'unavailable', 'permission_required')),
  access_class text not null
    check (access_class in ('public_app', 'known_professional', 'creator_authorized', 'unsupported', 'not_returned')),
  consent_record_id text references market2_creator_consents(consent_record_id),
  method_version text not null,
  baseline_observation_id bigint references market2_provider_observations(observation_id) on delete set null,
  current_observation_id bigint references market2_provider_observations(observation_id) on delete set null,
  observation_ids bigint[] not null default '{}',
  generated_at timestamptz not null,
  check (
    state not in ('complete', 'partial')
    or (
      baseline_value is not null
      and current_value is not null
      and absolute_delta is not null
      and sample_count >= 2
      and coalesce(array_length(observation_ids, 1), 0) >= 2
    )
  ),
  check (
    state <> 'newly_observed'
    or (absolute_delta is null and percent_delta is null and sample_count = 1)
  ),
  check (
    access_class <> 'creator_authorized'
    or state in ('unavailable', 'permission_required')
    or consent_record_id is not null
  )
);

create table if not exists market2_consent_scopes (
  consent_scope_id bigint generated always as identity primary key,
  consent_record_id text not null references market2_creator_consents(consent_record_id) on delete cascade,
  scope text not null check (scope in (
    'identity_link',
    'profile_publication',
    'proof_display',
    'owner_metrics_publication',
    'score_use',
    'trading',
    'settlement'
  )),
  platform text check (platform is null or platform in ('x', 'youtube', 'instagram', 'github')),
  instrument text check (instrument is null or instrument in ('milestones', 'pk-market', 'creator-arena', 'creator-perps')),
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  effective_at timestamptz not null,
  expires_at timestamptz,
  revoked_at timestamptz,
  evidence_reference text not null,
  created_at timestamptz not null default now(),
  check (expires_at is null or effective_at < expires_at),
  check (status <> 'revoked' or revoked_at is not null)
);

create table if not exists market2_market_catalog (
  market_id text primary key,
  person_id text not null references market2_people(person_id) on delete restrict,
  content_id text references market2_content_items(content_id) on delete set null,
  instrument text not null check (instrument in ('milestones', 'pk-market', 'creator-arena', 'creator-perps')),
  subject_scope text not null check (subject_scope in ('person', 'content', 'comparison')),
  question text not null,
  status text not null default 'draft'
    check (status in ('draft', 'proposed', 'review', 'open', 'paused', 'closed', 'resolved', 'voided')),
  publication_state text not null default 'private'
    check (publication_state in ('private', 'review', 'published', 'removed')),
  is_simulation boolean not null default true,
  consent_record_id text references market2_creator_consents(consent_record_id),
  measurement_provider text not null check (measurement_provider in ('x', 'youtube', 'instagram', 'github')),
  measurement_metric_key text not null,
  measurement_access_class text not null
    check (measurement_access_class in ('public_app', 'known_professional', 'creator_authorized', 'unsupported', 'not_returned')),
  baseline_value numeric,
  baseline_observed_at timestamptz,
  target_value numeric,
  observation_starts_at timestamptz not null,
  closes_at timestamptz not null,
  resolution_source text not null,
  provider_policy_review text not null default 'pending'
    check (provider_policy_review in ('pending', 'approved', 'rejected')),
  rights_review text not null default 'pending'
    check (rights_review in ('pending', 'approved', 'rejected')),
  risk_review text not null default 'pending'
    check (risk_review in ('pending', 'approved', 'rejected')),
  oracle_state text not null default 'pending'
    check (oracle_state in ('pending', 'approved', 'degraded', 'unavailable')),
  rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (observation_starts_at < closes_at),
  check (length(trim(question)) > 0),
  check (length(trim(resolution_source)) > 0),
  check (publication_state <> 'published' or is_simulation = true),
  check (
    status <> 'open'
    or (
      is_simulation = true
      and consent_record_id is not null
      and provider_policy_review = 'approved'
      and rights_review = 'approved'
      and risk_review = 'approved'
      and oracle_state = 'approved'
      and measurement_access_class not in ('unsupported', 'not_returned')
    )
  )
);

create table if not exists market2_market_outcomes (
  outcome_id text primary key,
  market_id text not null references market2_market_catalog(market_id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  settlement_value numeric,
  created_at timestamptz not null default now(),
  unique (market_id, label)
);

create table if not exists market2_market_oracles (
  oracle_id text primary key,
  market_id text not null references market2_market_catalog(market_id) on delete cascade,
  source_url text not null,
  metric_key text not null,
  cutoff_at timestamptz not null,
  grace_period_seconds integer not null default 0 check (grace_period_seconds >= 0),
  deletion_rule text not null,
  tie_rule text,
  void_rule text not null,
  dispute_window_seconds integer not null default 0 check (dispute_window_seconds >= 0),
  state text not null default 'pending' check (state in ('pending', 'approved', 'degraded', 'unavailable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists market2_market_quotes (
  quote_id text primary key,
  market_id text not null references market2_market_catalog(market_id) on delete cascade,
  outcome_id text references market2_market_outcomes(outcome_id) on delete cascade,
  side text not null check (side in ('yes', 'no', 'long', 'short')),
  bid_price numeric,
  ask_price numeric,
  mark_price numeric,
  is_simulation boolean not null default true check (is_simulation = true),
  observed_at timestamptz not null,
  expires_at timestamptz not null,
  check (observed_at < expires_at)
);

create table if not exists market2_market_fills (
  fill_id text primary key,
  market_id text not null references market2_market_catalog(market_id) on delete restrict,
  outcome_id text references market2_market_outcomes(outcome_id) on delete restrict,
  account_reference text not null,
  side text not null check (side in ('yes', 'no', 'long', 'short')),
  order_type text not null check (order_type in ('market', 'limit')),
  quantity numeric not null check (quantity > 0),
  price numeric not null check (price >= 0),
  fee numeric not null default 0 check (fee >= 0),
  is_simulation boolean not null default true check (is_simulation = true),
  filled_at timestamptz not null
);

create table if not exists market2_simulated_positions (
  position_id text primary key,
  market_id text not null references market2_market_catalog(market_id) on delete restrict,
  outcome_id text references market2_market_outcomes(outcome_id) on delete restrict,
  account_reference text not null,
  side text not null check (side in ('yes', 'no', 'long', 'short')),
  quantity numeric not null check (quantity >= 0),
  average_price numeric not null check (average_price >= 0),
  maximum_loss numeric not null check (maximum_loss >= 0),
  is_simulation boolean not null default true check (is_simulation = true),
  opened_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists market2_market_drafts (
  draft_id text primary key,
  account_reference text,
  person_id text not null references market2_people(person_id) on delete restrict,
  content_id text references market2_content_items(content_id) on delete set null,
  instrument text not null check (instrument in ('milestones', 'pk-market', 'creator-arena', 'creator-perps')),
  subject_scope text not null check (subject_scope in ('person', 'content', 'comparison')),
  payload jsonb not null default '{}'::jsonb,
  validation_state text not null default 'incomplete'
    check (validation_state in ('incomplete', 'invalid', 'valid', 'review_required', 'approved', 'rejected')),
  eligibility_blockers jsonb not null default '[]'::jsonb,
  consent_record_id text references market2_creator_consents(consent_record_id),
  is_simulation boolean not null default true check (is_simulation = true),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into market2_provider_observations (
  person_id,
  provider,
  subject_type,
  subject_id,
  metric_key,
  native_metric_name,
  label,
  unit,
  metric_kind,
  raw_value,
  raw_text,
  observation_window,
  availability,
  access_class,
  provider_timestamp,
  observed_at,
  fetched_at,
  fresh_until,
  stale_at,
  source_url,
  policy_version,
  provider_rank,
  is_derived,
  policy_mode,
  raw_hash
)
select
  legacy.person_id,
  legacy.platform,
  legacy.subject_type,
  legacy.subject_id,
  legacy.metric_name,
  legacy.metric_name,
  replace(initcap(replace(legacy.metric_name, '_', ' ')), ' ', ' '),
  'count',
  case when legacy.metric_name = 'provider_rank' then 'rank' else 'counter' end,
  legacy.raw_metric_value,
  legacy.raw_metric_text,
  legacy.observation_window,
  case when legacy.raw_metric_value is null and legacy.raw_metric_text is null then 'not_returned' else 'available' end,
  case when legacy.platform = 'instagram' then 'known_professional' else 'public_app' end,
  legacy.source_timestamp,
  legacy.observed_at,
  legacy.created_at,
  legacy.observed_at,
  legacy.observed_at,
  coalesce(legacy.provider_payload_reference, 'legacy:market2_metric_snapshots/' || legacy.snapshot_id::text),
  'legacy-market2-v1',
  legacy.provider_rank,
  legacy.is_derived,
  legacy.policy_mode,
  'legacy:' || legacy.snapshot_id::text || ':' || md5(concat_ws('|',
    legacy.platform,
    legacy.subject_type,
    legacy.subject_id,
    legacy.metric_name,
    legacy.observed_at::text
  ))
from market2_metric_snapshots legacy
on conflict (raw_hash) do nothing;

create or replace view market2_public_market_catalog as
select
  market.*,
  (
    market.status = 'open'
    and market.publication_state = 'published'
    and market.is_simulation = true
    and consent.status = 'active'
    and consent.grants_profile_publication = true
    and consent.grants_trading = true
    and (consent.expires_at is null or consent.expires_at > now())
    and exists (
      select 1
      from market2_consent_scopes scope
      where scope.consent_record_id = consent.consent_record_id
        and scope.scope = 'trading'
        and scope.status = 'active'
        and (scope.instrument is null or scope.instrument = market.instrument)
        and (scope.expires_at is null or scope.expires_at > now())
    )
    and market.provider_policy_review = 'approved'
    and market.rights_review = 'approved'
    and market.risk_review = 'approved'
    and market.oracle_state = 'approved'
  ) as trade_eligible
from market2_market_catalog market
left join market2_creator_consents consent
  on consent.consent_record_id = market.consent_record_id
 and consent.person_id = market.person_id
where market.publication_state = 'published'
  and market.is_simulation = true;

create index if not exists market2_identity_person_idx
  on market2_identity_links (person_id, review_state, reviewed_at desc);

create index if not exists market2_observation_subject_idx
  on market2_provider_observations (person_id, provider, metric_key, observed_at desc);

create index if not exists market2_observation_window_idx
  on market2_provider_observations (person_id, observation_window, observed_at desc);

create index if not exists market2_rollup_person_window_idx
  on market2_metric_rollups (person_id, observation_window, generated_at desc);

create index if not exists market2_catalog_person_status_idx
  on market2_market_catalog (person_id, publication_state, status, closes_at);

create index if not exists market2_drafts_person_updated_idx
  on market2_market_drafts (person_id, updated_at desc);

create unique index if not exists market2_consent_scope_unique_idx
  on market2_consent_scopes (
    consent_record_id,
    scope,
    coalesce(platform, '*'),
    coalesce(instrument, '*')
  );

comment on table market2_identity_links is
  'Reviewed account-to-person links. Display names are never a merge key.';

comment on table market2_provider_observations is
  'Immutable native provider observations with availability, access, provenance, and freshness metadata.';

comment on table market2_metric_rollups is
  'Window movement derived only from separately retained baseline and current observations.';

comment on view market2_public_market_catalog is
  'Published simulated markets with a fail-closed trade_eligible flag derived from live consent and review gates.';

commit;
