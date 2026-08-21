#!/usr/bin/env node

import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export const TRADES_ELIGIBILITY_SCHEMA = 'backer-trades-account-eligibility-v4';
export const TRADES_ELIGIBILITY_METHOD = 'source-backed-account-eligibility-v4';
export const TRADES_WORK_ELIGIBILITY_METHOD = 'source-backed-work-eligibility-v1';
export const TRADES_PROFILE_PROVIDERS = Object.freeze(['github', 'dev']);

const DEFAULT_CATALOG = new URL('../data/discovery-catalog.json', import.meta.url);
const DEFAULT_OUTPUT = new URL('../data/trades-eligible-accounts.json', import.meta.url);
const FIXTURE_PREFIX = /^(?:demo|fixture|synthetic)[-_]/i;
const FIXTURE_NAME = /^(?:demo|fixture|synthetic)(?:\b|[-_])/i;
const ORGANIZATION_WORDS = /(?:\b(?:agency|association|collective|community|company|corp(?:oration)?|foundation|group|institute|labs?|magazine|media|network|news|official|organization|platform|podcast|press|software|staff|studio|systems|team|technologies|technology|university|ventures)\b|(?:^|[-_])(?:ai|inc|llc|org)(?:$|[-_]))/i;
const KNOWN_ORGANIZATION_SHAPES = /(?:\b(?:department of|school of|the .* blog|made by google|associated press|microsoft|github|deepseek|moonshot|minimax|youtube creators|firecrawl|informer tech|autocomp)\b|^(?:ted|time)$|黑神话|鸣潮)/i;
const PRODUCT_ACCOUNT_SHAPES = /(?:\b(?:solutions|tools?|apps?|editorial|engineering note|utility hub|watcher|model|project|messenger|intelligence|apis?|devops daily)\b|(?:kit|labs?|studios?|devs|tools|apps|hub|bot|os)$)/i;
const PROFILE_PROVIDER_SET = new Set(TRADES_PROFILE_PROVIDERS);
const PROFILE_OBSERVATION_RULES = Object.freeze({
  github: { metric: 'followers', methodologyVersion: 'github-rest-v3-user-profile-v1' },
  dev: { metric: 'published_posts', methodologyVersion: 'forem-api-v1-public-user-articles-v1' }
});
/* Keep the acquisition wave stable when market eligibility gets stricter.
   These baseline exclusions defined the 742 GitHub + 516 DEV target set that
   was actually observed; later exact account exclusions belong only to the
   market projection. */
const ACQUISITION_KNOWN_NON_PERSON_ACCOUNTS = new Set([
  'abel solutions', 'accreditly', 'agent island', 'agent-risk', 'agentskit', 'ai explore',
  'ai jewelry model', 'all in one utility hub', 'apalon', 'apogee watcher', 'bazi clarity',
  'bitcoin_devto', 'block_hacks', 'broke to built', 'chomping tools alligator', 'codexlancers',
  'creatortoolsjp', 'destlabs', 'devops daily', 'draftkit', 'flowork os', 'freeviralkit',
  'genesis project', 'getinfo toyou', 'gridport', 'haven messenger', 'iconsearch',
  'image splitting field notes', 'insightlab', 'insightraider', 'instasla', 'junoengine devs',
  'kai x intelligence', 'loginsoft', 'lottolens ph editorial', 'mininglamp', 'mock health',
  'quantizelab', 'raxxo studios', 'review-it', 'singularitystudiosdev', 'skillselion',
  'snap loom', 'stockpulse', 'sunverseai', 'synergic-apis', 'telegram bot engineering note',
  'uncommon apps', 'uptime architect', 'vividbeam', 'wayknow', 'zuidaima',
  'agentziseparator', 'alphabinproxy', 'dacnay816y62-hub', 'donutlabs', 'ghoulgateproxy10',
  'lincwang123-bot', 'ooolabdev', 'opentokenz', 'openvapecn', 'pc2005-cloud', 'smnetstudio',
  'steel-api6666859', 'teamjourneymanmarina', 'tonbistudio', 'vectoragentdiscover',
  'weightpebbleproxy', 'awesome-dsh-plugin', 'trycompai', 'moonshotai',
  'disc makers', 'the guardian', 'txt_official', 'playstation',
  '四川观察', '影视飓风', 'music money makeover show',
  'more best ever food review show', 'the filmy folk', 'one more time'
]);
const KNOWN_NON_PERSON_ACCOUNTS = new Set([
  ...ACQUISITION_KNOWN_NON_PERSON_ACCOUNTS,
  'nova', 'nova-agent', 'aigclink', 'fuxicode', 'fuxicodex',
  'ddosi', 'fufankeji', 'beyondata'
]);

function clean(value) {
  return String(value == null ? '' : value).trim();
}

function safeUrl(value) {
  const raw = clean(value);
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    return ['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password
      ? parsed.href : '';
  } catch (_error) {
    return '';
  }
}

function exactMetric(row) {
  return Boolean(row && clean(row.id) && clean(row.entityId || row.entity_id)
    && clean(row.provider || row.platform) && clean(row.metric || row.key)
    && Number.isFinite(Number(row.value))
    && clean(row.availability || 'available').toLowerCase() === 'available'
    && safeUrl(row.sourceUrl || row.source_url)
    && !Number.isNaN(Date.parse(row.observedAt || row.observed_at)));
}

function profileMetricPriority(row) {
  const metric = clean(row && (row.metric || row.key)).toLowerCase();
  if (/^(?:followers?|subscribers?)$/.test(metric)) return 100;
  if (/^(?:published_posts|posts|public_repositories)$/.test(metric)) return 90;
  if (/views?/.test(metric)) return 80;
  if (/videos?_observed|videos?/.test(metric)) return 70;
  return 10;
}

function organizationLike(creator, identity, exactExclusions = KNOWN_NON_PERSON_ACCOUNTS) {
  const name = clean(creator && (creator.displayName || creator.display_name || creator.name));
  const handle = clean(identity && (identity.handle || identity.nativeId || identity.native_id)).replace(/^@/, '');
  return ORGANIZATION_WORDS.test(name) || ORGANIZATION_WORDS.test(handle)
    || KNOWN_ORGANIZATION_SHAPES.test(name) || PRODUCT_ACCOUNT_SHAPES.test(name)
    || exactExclusions.has(name.toLowerCase())
    || exactExclusions.has(handle.toLowerCase());
}

function fixtureLike(...values) {
  return values.some((value) => FIXTURE_PREFIX.test(clean(value)) || FIXTURE_NAME.test(clean(value)));
}

function urlOwnsIdentity(provider, canonicalUrl, identity) {
  if (!['dev', 'github'].includes(provider)) return true;
  try {
    const owner = new URL(canonicalUrl).pathname.split('/').filter(Boolean)[0].toLowerCase();
    const handle = clean(identity && (identity.handle || identity.nativeId || identity.native_id))
      .replace(/^@/, '').toLowerCase();
    return Boolean(owner && handle && owner === handle);
  } catch (_error) {
    return false;
  }
}

function eligibleWork(row, context) {
  if (!row) return null;
  const id = clean(row.id);
  const creatorId = clean(row.creatorId || row.creator_id);
  const identityId = clean(row.platformIdentityId || row.platform_identity_id);
  const provider = clean(row.provider || row.platform).toLowerCase();
  const identity = context.identityById.get(identityId);
  const creator = context.creatorById.get(creatorId);
  const title = clean(row.title);
  const canonicalUrl = safeUrl(row.canonicalUrl || row.canonical_url || row.url);
  const thumbnailUrl = safeUrl(row.thumbnailUrl || row.thumbnail_url);
  const thumbnailSourceUrl = safeUrl(row.thumbnailSourceUrl || row.thumbnail_source_url || canonicalUrl);
  const creatorAvatarUrl = safeUrl(creator && (creator.avatarUrl || creator.avatar_url));
  const creatorAvatarSourceUrl = safeUrl(creator && (creator.avatarSourceUrl || creator.avatar_source_url));
  const metrics = context.metricsByEntity.get(id) || [];
  if (!id || !creator || !identity || !provider || !title || !canonicalUrl || !thumbnailUrl
    || !thumbnailSourceUrl || !creatorAvatarUrl || !creatorAvatarSourceUrl
    || !metrics.length || fixtureLike(id, title)
    || clean(identity.creatorId || identity.creator_id) !== creatorId
    || clean(identity.provider || identity.platform).toLowerCase() !== provider
    || !urlOwnsIdentity(provider, canonicalUrl, identity)) return null;
  return { row, id, creatorId, identityId, provider, canonicalUrl, metrics };
}

/* The acquisition wave is stable even after failed accounts are omitted from
   the published eligibility registry. It is derived from retained account
   shape plus at least one independently valid source work, never from an
   account metric and never from the prior generated output. */
export function buildProfileMetricTargets(catalog) {
  if (!catalog || typeof catalog !== 'object') throw new Error('Invalid Discovery catalog');
  const creators = Array.isArray(catalog.creators) ? catalog.creators : [];
  const identities = Array.isArray(catalog.platformIdentities || catalog.platform_identities)
    ? (catalog.platformIdentities || catalog.platform_identities) : [];
  const contents = Array.isArray(catalog.contentRecords || catalog.content_records)
    ? (catalog.contentRecords || catalog.content_records) : [];
  const observations = Array.isArray(catalog.metricObservations || catalog.metric_observations)
    ? (catalog.metricObservations || catalog.metric_observations) : [];
  const creatorById = new Map(creators.map((row) => [clean(row && row.id), row]).filter(([id]) => id));
  const identityById = new Map(identities.map((row) => [clean(row && row.id), row]).filter(([id]) => id));
  const metricsByEntity = new Map();
  for (const row of observations) {
    if (!exactMetric(row)) continue;
    const entityId = clean(row.entityId || row.entity_id);
    if (!metricsByEntity.has(entityId)) metricsByEntity.set(entityId, []);
    metricsByEntity.get(entityId).push(row);
  }
  const workCreatorIds = new Set(contents.map((row) => eligibleWork(row, {
    creatorById, identityById, metricsByEntity
  })).filter(Boolean).map((work) => work.creatorId));
  return creators.map((creator) => {
    const creatorId = clean(creator && creator.id);
    if (!creatorId || !workCreatorIds.has(creatorId)) return null;
    const identity = identityById.get(clean(creator.primaryIdentityId || creator.primary_identity_id));
    const identityId = clean(identity && identity.id);
    const provider = clean(identity && (identity.provider || identity.platform)).toLowerCase();
    const nativeId = clean(identity && (identity.nativeId || identity.native_id));
    const handle = clean(identity && (identity.handle || nativeId));
    const profileUrl = safeUrl(identity && (identity.profileUrl || identity.profile_url || identity.url));
    const avatarUrl = safeUrl(creator.avatarUrl || creator.avatar_url);
    const avatarSourceUrl = safeUrl(creator.avatarSourceUrl || creator.avatar_source_url || profileUrl);
    const displayName = clean(creator.displayName || creator.display_name || creator.name);
    const accountType = clean(identity && (identity.accountType || identity.account_type)).toLowerCase();
    if (!identity || !PROFILE_PROVIDER_SET.has(provider) || !identityId || !nativeId || !handle || !profileUrl
      || !avatarUrl || !avatarSourceUrl || fixtureLike(creatorId, identityId, displayName, handle)
      || organizationLike(creator, identity, ACQUISITION_KNOWN_NON_PERSON_ACCOUNTS)
      || (provider === 'github' && accountType !== 'user')) return null;
    return { creatorId, identityId, provider, nativeId, handle, profileUrl };
  }).filter(Boolean).sort((left, right) => left.identityId.localeCompare(right.identityId));
}

export function buildTradesEligibility(catalog) {
  if (!catalog || typeof catalog !== 'object') throw new Error('Invalid Discovery catalog');
  const creators = Array.isArray(catalog.creators) ? catalog.creators : [];
  const identities = Array.isArray(catalog.platformIdentities || catalog.platform_identities)
    ? (catalog.platformIdentities || catalog.platform_identities) : [];
  const contents = Array.isArray(catalog.contentRecords || catalog.content_records)
    ? (catalog.contentRecords || catalog.content_records) : [];
  const observations = Array.isArray(catalog.metricObservations || catalog.metric_observations)
    ? (catalog.metricObservations || catalog.metric_observations) : [];
  const creatorById = new Map(creators.map((row) => [clean(row && row.id), row]).filter(([id]) => id));
  const identityById = new Map(identities.map((row) => [clean(row && row.id), row]).filter(([id]) => id));
  const metricsByEntity = new Map();
  for (const row of observations) {
    if (!exactMetric(row)) continue;
    const entityId = clean(row.entityId || row.entity_id);
    if (!metricsByEntity.has(entityId)) metricsByEntity.set(entityId, []);
    metricsByEntity.get(entityId).push(row);
  }
  for (const rows of metricsByEntity.values()) rows.sort((left, right) => {
    const priority = profileMetricPriority(right) - profileMetricPriority(left);
    const time = Date.parse(right.observedAt || right.observed_at) - Date.parse(left.observedAt || left.observed_at);
    return priority || time || clean(left.id).localeCompare(clean(right.id));
  });
  const context = { creatorById, identityById, metricsByEntity };
  const eligibleWorks = contents.map((row) => eligibleWork(row, context)).filter(Boolean);
  const identitiesByCreator = new Map();
  for (const identity of identities) {
    const creatorId = clean(identity && (identity.creatorId || identity.creator_id));
    if (!identitiesByCreator.has(creatorId)) identitiesByCreator.set(creatorId, []);
    identitiesByCreator.get(creatorId).push(identity);
  }
  const entries = [];
  const rejected = {
    authoritativeProviderOrganization: 0,
    missingAuthoritativeAccountType: 0,
    organizationShape: 0,
    missingAccountNativeMetric: 0,
    missingCreatorAccountEvidence: 0,
    unsupportedProfileProvider: 0,
    fixtureShape: 0
  };
  for (const creator of creators) {
    const creatorId = clean(creator && creator.id);
    const primaryIdentityId = clean(creator && (creator.primaryIdentityId || creator.primary_identity_id));
    const retainedPrimary = identityById.get(primaryIdentityId);
    const retainedPrimaryProvider = clean(retainedPrimary && (retainedPrimary.provider || retainedPrimary.platform)).toLowerCase();
    const retainedPrimaryAccountType = clean(retainedPrimary && (retainedPrimary.accountType || retainedPrimary.account_type));
    if (retainedPrimaryProvider === 'github' && retainedPrimaryAccountType === 'organization') {
      rejected.authoritativeProviderOrganization += 1;
      continue;
    }
    if (retainedPrimaryProvider === 'github' && retainedPrimaryAccountType !== 'user') {
      rejected.missingAuthoritativeAccountType += 1;
      continue;
    }
    if (!creatorId) continue;
    const primary = identityById.get(primaryIdentityId);
    const identity = primary || (identitiesByCreator.get(creatorId) || [])[0];
    const identityId = clean(identity && identity.id);
    const provider = clean(identity && (identity.provider || identity.platform)).toLowerCase();
    const nativeId = clean(identity && (identity.nativeId || identity.native_id));
    const profileUrl = safeUrl(identity && (identity.profileUrl || identity.profile_url || identity.url));
    const avatarUrl = safeUrl(creator.avatarUrl || creator.avatar_url);
    const avatarSourceUrl = safeUrl(creator.avatarSourceUrl || creator.avatar_source_url || profileUrl);
    const displayName = clean(creator.displayName || creator.display_name || creator.name);
    const handle = clean(identity && (identity.handle || nativeId));
    const sourceAccountType = provider === 'github' ? 'user' : 'creator_account';
    if (!PROFILE_PROVIDER_SET.has(provider)) {
      rejected.unsupportedProfileProvider += 1;
      continue;
    }
    if (fixtureLike(creatorId, identityId, displayName, handle)) {
      rejected.fixtureShape += 1;
      continue;
    }
    if (organizationLike(creator, identity)) {
      rejected.organizationShape += 1;
      continue;
    }
    const observationRule = PROFILE_OBSERVATION_RULES[provider];
    const referenceMetric = (metricsByEntity.get(identityId) || []).find((row) => clean(row.entityType || row.entity_type).toLowerCase() === 'identity'
      && clean(row.entityId || row.entity_id) === identityId && clean(row.provider).toLowerCase() === provider
      && clean(row.metric || row.key).toLowerCase() === observationRule.metric
      && clean(row.methodologyVersion || row.methodology_version) === observationRule.methodologyVersion
      && safeUrl(row.sourceUrl || row.source_url) === profileUrl);
    if (!referenceMetric) {
      rejected.missingAccountNativeMetric += 1;
      continue;
    }
    if (!identityId || !provider || !nativeId || !profileUrl || !avatarUrl || !avatarSourceUrl
      || !referenceMetric) {
      rejected.missingCreatorAccountEvidence += 1;
      continue;
    }
    entries.push({
      creatorId,
      identityId,
      provider,
      nativeId,
      profileUrl,
      sourceAccountType,
      eligibilityState: 'eligible',
      entityKind: 'creator_account',
      eligibilityScope: 'public_creator_account_shape',
      assessedAt: clean(referenceMetric.observedAt || referenceMetric.observed_at),
      methodology: TRADES_ELIGIBILITY_METHOD,
      evidenceUrls: Array.from(new Set([profileUrl, safeUrl(referenceMetric.sourceUrl || referenceMetric.source_url)].filter(Boolean))),
      referenceObservationId: clean(referenceMetric.id),
      accountClaim: 'source_backed_creator_account_not_legal_identity',
      personhoodVerified: false,
      legalIdentityVerified: false,
      automatedEligibility: true
    });
  }
  const workEntries = eligibleWorks.map((work) => {
    const referenceMetric = work.metrics.find((row) => clean(row.entityType || row.entity_type).toLowerCase() === 'content'
      && clean(row.entityId || row.entity_id) === work.id && clean(row.provider).toLowerCase() === work.provider);
    if (!referenceMetric) return null;
    return {
      contentId: work.id,
      creatorId: work.creatorId,
      identityId: work.identityId,
      provider: work.provider,
      eligibilityState: 'eligible',
      entityKind: 'content',
      eligibilityScope: 'public_source_work',
      assessedAt: clean(referenceMetric.observedAt || referenceMetric.observed_at),
      methodology: TRADES_WORK_ELIGIBILITY_METHOD,
      evidenceUrls: Array.from(new Set([work.canonicalUrl, safeUrl(referenceMetric.sourceUrl || referenceMetric.source_url)].filter(Boolean))),
      referenceObservationId: clean(referenceMetric.id),
      automatedEligibility: true
    };
  }).filter(Boolean).sort((left, right) => left.contentId.localeCompare(right.contentId));
  const providerDistribution = {};
  for (const entry of entries) providerDistribution[entry.provider] = (providerDistribution[entry.provider] || 0) + 1;
  const githubAccountTypeCoverage = { user: 0, organization: 0, missing: 0 };
  for (const identity of identities) {
    if (clean(identity && (identity.provider || identity.platform)).toLowerCase() !== 'github') continue;
    const accountType = clean(identity && (identity.accountType || identity.account_type));
    if (accountType === 'user' || accountType === 'organization') githubAccountTypeCoverage[accountType] += 1;
    else githubAccountTypeCoverage.missing += 1;
  }
  const generatedAt = entries.concat(workEntries).reduce((latest, entry) => {
    const current = clean(entry.assessedAt);
    return Date.parse(current) > Date.parse(latest || '') ? current : latest;
  }, clean(catalog.generatedAt || catalog.generated_at));
  return {
    schemaVersion: TRADES_ELIGIBILITY_SCHEMA,
    generatedAt,
    policy: 'Public Trades admits Profile subjects only from validated GitHub User and DEV account identities with avatar provenance and the provider-specific account observation retained by the profile-metric acquisition. Failed or missing account acquisitions cannot qualify, and work-level observations cannot qualify or resolve a Profile contract. Content subjects are validated independently from their exact retained source-account and creator linkage, media, canonical source, and content-native observation; their linked creator need not have a Profile contract. This automated account-scope eligibility does not establish personhood or legal identity.',
    methodology: {
      id: TRADES_ELIGIBILITY_METHOD,
      automated: true,
      accountScopeOnly: true,
      personhoodVerified: false,
      legalIdentityVerified: false,
      required: ['exact_platform_identity', 'public_profile_url', 'avatar_with_provenance', 'numeric_identity_native_source_observation'],
      profileProviders: TRADES_PROFILE_PROVIDERS.slice(),
      profileObservationRule: 'identity-entity-only-v1',
      providerAccountTypeRule: 'github-official-owner-type-user-required-v1',
      organizationExclusion: 'official-provider-type-before-organization-shape-terms-v2'
    },
    counts: {
      eligibleProfiles: entries.length,
      eligibleWorks: workEntries.length,
      rejected,
      providerDistribution,
      authoritativeAccountTypeCoverage: { github: githubAccountTypeCoverage }
    },
    entries,
    workEntries
  };
}

async function main() {
  const catalogPath = process.env.BACKER_DISCOVERY_CATALOG
    ? pathToFileURL(resolve(process.env.BACKER_DISCOVERY_CATALOG)) : DEFAULT_CATALOG;
  const outputPath = process.env.BACKER_TRADES_ELIGIBILITY_OUTPUT
    ? pathToFileURL(resolve(process.env.BACKER_TRADES_ELIGIBILITY_OUTPUT)) : DEFAULT_OUTPUT;
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
  const result = buildTradesEligibility(catalog);
  if (result.counts.eligibleProfiles < 1000 || result.counts.eligibleWorks < 1000) {
    throw new Error(`Trades release gate failed: ${result.counts.eligibleProfiles} profiles / ${result.counts.eligibleWorks} works`);
  }
  if (Object.keys(result.counts.providerDistribution).sort().join(',') !== TRADES_PROFILE_PROVIDERS.slice().sort().join(',')) {
    throw new Error(`Trades Profile provider gate failed: ${Object.keys(result.counts.providerDistribution).sort().join(',')}`);
  }
  const temporaryPath = new URL(`.trades-eligibility-${process.pid}.tmp`, outputPath);
  try {
    await writeFile(temporaryPath, `${JSON.stringify(result)}\n`, { encoding: 'utf8', mode: 0o600 });
    const verified = JSON.parse(await readFile(temporaryPath, 'utf8'));
    if (JSON.stringify(verified) !== JSON.stringify(result)) throw new Error('Temporary eligibility registry verification failed');
    await rename(temporaryPath, outputPath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }
  process.stdout.write(`${JSON.stringify({ output: outputPath.pathname, ...result.counts }, null, 2)}\n`);
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}
