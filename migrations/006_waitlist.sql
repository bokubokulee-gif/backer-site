-- Standalone: no analytics tables or extensions are required.
begin;

create table if not exists backer_waitlist (
  email text primary key check (email = lower(email) and length(email) between 3 and 254),
  source text not null default 'backer-waitlist' check (source = 'backer-waitlist'),
  created_at timestamptz not null default now()
);

create table if not exists backer_waitlist_rate_limits (
  key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$'),
  bucket_start timestamptz not null,
  request_count integer not null check (request_count > 0),
  expires_at timestamptz not null,
  primary key (key_hash, bucket_start)
);

create index if not exists backer_waitlist_rate_limits_expiry_idx
  on backer_waitlist_rate_limits (expires_at);

-- Only the server database owner (or a deliberately provisioned backend role)
-- may access these tables. There are no browser-readable RLS policies.
alter table backer_waitlist enable row level security;
alter table backer_waitlist_rate_limits enable row level security;
revoke all on backer_waitlist, backer_waitlist_rate_limits from public;

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on backer_waitlist, backer_waitlist_rate_limits from anon';
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    execute 'revoke all on backer_waitlist, backer_waitlist_rate_limits from authenticated';
  end if;
end;
$$;

commit;
