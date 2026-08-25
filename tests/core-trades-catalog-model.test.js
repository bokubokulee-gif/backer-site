'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { pathToFileURL } = require('node:url');
const model = require('../js/trades-catalog-model');

const ROOT = path.join(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'discovery-catalog.json'), 'utf8'));
const eligibilityRegistry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'trades-eligible-accounts.json'), 'utf8'));
const BUCKET = '2026-08-21T08:00:00.000Z';
const KNOWN_NON_PERSON_ACCOUNTS = new Set(`Abel Solutions|Accreditly|Agent Island|Agent-Risk|AgentsKit|AI Explore|AI Jewelry Model|All in one utility hub|APALON|Apogee Watcher|Bazi Clarity|bitcoin_devto|block_hacks|Broke to Built|Chomping Tools Alligator|Codexlancers|creatortoolsjp|DestLabs|DevOps Daily|draftkit|FLOWORK Os|FreeViralKit|Genesis Project|Getinfo Toyou|GridPort|Haven Messenger|IconSearch|Image Splitting Field Notes|insightlab|Insightraider|InstaSLA|JunoEngine Devs|Kai X Intelligence|Loginsoft|LottoLens PH Editorial|Mininglamp|mock health|QuantizeLab|RAXXO Studios|review-it|singularitystudiosdev|Skillselion|Snap Loom|StockPulse|SunverseAI|Synergic-Apis|Telegram Bot Engineering Note|Uncommon Apps|Uptime Architect|vividbeam|wayknow|zuidaima|Agentziseparator|Alphabinproxy|dacnay816y62-hub|donutlabs|GhoulGateProxy10|lincwang123-bot|ooolabdev|opentokenz|OpenVapeCN|PC2005-cloud|SMNETSTUDIO|Steel-api6666859|teamjourneymanmarina|tonbistudio|vectoragentdiscover|weightpebbleproxy|firecrawl|TED|TIME|黑神话|鸣潮|Informer Tech|Autocomp|awesome-dsh-plugin|trycompai|MoonshotAI|Nova|nova-agent|AIGCLINK|fuxicode|fuxicodex|ddosi|fufankeji|Beyondata|Disc Makers|The Guardian|TXT_OFFICIAL|PlayStation|四川观察|影视飓风|Music Money Makeover Show|More Best Ever Food Review Show|The Filmy Folk|One More Time`.toLowerCase().split('|'));

function build(options = {}) {
  return model.build(catalog, { eligibilityRegistry, simulationBucket: BUCKET, ...options });
}

function uniqueCount(values) {
  return new Set(values).size;
}

function assertContract(subject) {
  const { contract } = subject;
  assert.ok(contract && contract.id && contract.question.endsWith('?'));
  assert.equal(contract.subjectId, subject.id);
  assert.equal(contract.isSimulation, true);
  assert.ok(Number.isFinite(contract.baseline.value));
  assert.ok(Number.isFinite(contract.target.value));
  assert.ok(contract.target.value > contract.baseline.value);
  assert.ok(contract.target.multiplier >= 1.08 && contract.target.multiplier <= 1.25);
  assert.ok(contract.cutoff > contract.baseline.observedAt);
  assert.ok(contract.metric.entityId && contract.metric.observationId && /^https:\/\//.test(contract.metric.sourceUrl));
  assert.match(contract.resolutionRule, /same provider/i);
  assert.deepEqual(contract.outcomes.map((row) => row.id), ['back', 'fade']);
  assert.equal(subject.simulation.contractId, contract.id);
  assert.equal(Number.isInteger(subject.simulation.supportPriceCents), true);
  assert.equal(subject.simulation.bucket, BUCKET);
  assert.equal(subject.simulation.bucketEndsAt, '2026-08-21T09:00:00.000Z');
  if (subject.kind === 'profile') {
    assert.equal(contract.metric.entityType, 'identity');
    assert.equal(contract.metric.entityId, subject.accounts[0].id);
    assert.equal(contract.referenceWork, null);
  } else {
    assert.equal(contract.metric.entityType, 'content');
    assert.equal(contract.metric.entityId, subject.id);
  }
}

const baseline = build();

test('Trades publishes at least 1,000 source-backed account markets and 1,000 exact work markets', () => {
  const eligible = new Map(eligibilityRegistry.entries.map((row) => [row.creatorId, row]));
  const eligibleWorks = new Map(eligibilityRegistry.workEntries.map((row) => [row.contentId, row]));
  assert.ok(eligibilityRegistry.entries.length >= 1000);
  assert.ok(baseline.people.length >= 1000, `only ${baseline.people.length} profile markets`);
  assert.ok(baseline.contents.length >= 1000, `only ${baseline.contents.length} work markets`);
  assert.equal(baseline.people.length, eligibilityRegistry.counts.eligibleProfiles);
  assert.equal(baseline.contents.length, eligibilityRegistry.counts.eligibleWorks);
  assert.equal(baseline.accountEligibility.rejectedCount, 0);
  assert.equal(baseline.status, 'source_backed_creator_accounts');
  assert.deepEqual(new Set(baseline.people.map((row) => row.provider)), new Set(['github', 'dev']));
  assert.equal(uniqueCount(baseline.people.map((row) => row.id)), baseline.people.length);
  assert.equal(uniqueCount(baseline.contents.map((row) => row.id)), baseline.contents.length);
  assert.equal(uniqueCount(baseline.people.map((row) => `${row.provider}:${row.accounts[0].nativeId}`)), baseline.people.length);
  assert.equal(uniqueCount(baseline.people.concat(baseline.contents).map((row) => row.contract.id)),
    baseline.people.length + baseline.contents.length);
  for (const person of baseline.people) {
    const accountEligibility = eligible.get(person.id);
    assert.ok(accountEligibility, `${person.id} was not eligible`);
    assert.equal(person.creatorAccount, true);
    assert.equal(person.humanConfirmed, false);
    assert.equal(person.identityReview, 'source_backed_public_creator_account');
    assert.equal('humanReview' in person, false);
    assert.equal(person.accounts.length, 1);
    assert.equal(person.accounts[0].id, accountEligibility.identityId);
    assert.equal(person.accounts[0].nativeId, accountEligibility.nativeId);
    assert.equal(person.profileUrl, accountEligibility.profileUrl);
    assert.match(person.avatar, /^https:\/\//);
    assert.match(person.avatarSourceUrl, /^https:\/\//);
    assert.ok(person.metrics.length > 0);
    assert.ok(person.metrics.every((row) => row.entityType === 'identity' && row.entityId === person.accounts[0].id));
    assert.equal(person.accountEligibility.personhoodVerified, false);
    assert.equal(person.accountEligibility.legalIdentityVerified, false);
    assertContract(person);
    assert.equal(person.contract.metric.observationId, accountEligibility.referenceObservationId,
      'Profile contract must use the registry-pinned identity observation');
    if (person.provider === 'dev') assert.equal(person.contract.metric.label, 'Published posts');
  }
  for (const content of baseline.contents) {
    const workEligibility = eligibleWorks.get(content.id);
    assert.ok(workEligibility, `${content.id} has no independent work eligibility`);
    assert.equal(content.workEligibility.identityId, workEligibility.identityId);
    assert.equal(content.workEligibility.creatorId, content.personId);
    assert.equal(content.provider, workEligibility.provider);
    assert.equal(content.contract.metric.observationId, workEligibility.referenceObservationId);
    assert.equal('humanReview' in content, false);
    assert.match(content.url, /^https:\/\//);
    assert.match(content.thumbnail, /^https:\/\//);
    assert.match(content.thumbnailSourceUrl, /^https:\/\//);
    assert.ok(content.metrics.length > 0);
    assertContract(content);
  }
  const forbidden = /^(?:demo|fixture|synthetic)(?:\b|[-_])/i;
  assert.ok(baseline.people.every((row) => !forbidden.test(row.id) && !forbidden.test(row.name)));
  assert.ok(baseline.contents.every((row) => !forbidden.test(row.id) && !forbidden.test(row.title)));
});

test('eligibility artifact is deterministic, account-scoped, and meets the release gate', async () => {
  const generatorUrl = pathToFileURL(path.join(ROOT, 'scripts', 'generate-trades-eligibility.mjs')).href;
  const enrichmentUrl = pathToFileURL(path.join(ROOT, 'scripts', 'enrich-trades-profile-metrics.mjs')).href;
  const { buildProfileMetricTargets, buildTradesEligibility } = await import(generatorUrl);
  const { PROFILE_METRIC_TARGET_SCHEMA, reusePartialSelection, validateStableTargetSeed } = await import(enrichmentUrl);
  const generated = buildTradesEligibility(catalog);
  const stableTargets = buildProfileMetricTargets(catalog);
  const targetDistribution = stableTargets.reduce((counts, row) => {
    counts[row.provider] = (counts[row.provider] || 0) + 1;
    return counts;
  }, {});
  assert.deepEqual(generated, eligibilityRegistry);
  assert.deepEqual(targetDistribution, { dev: 516, github: 742 },
    'the acquisition wave must retain failed DEV targets independently of published eligibility');
  assert.equal(stableTargets.length, 1258);
  const stableSeed = { schemaVersion: PROFILE_METRIC_TARGET_SCHEMA, entries: stableTargets };
  assert.deepEqual(validateStableTargetSeed(catalog, stableSeed), stableSeed);
  assert.throws(() => validateStableTargetSeed(catalog, eligibilityRegistry), /stable target-seed schema/,
    'generated v4 eligible output must never become the smaller retry seed');
  assert.throws(() => validateStableTargetSeed(catalog, {
    schemaVersion: PROFILE_METRIC_TARGET_SCHEMA,
    entries: stableTargets.slice(0, -1)
  }), /complete stable acquisition target set/,
  'a typed seed still fails closed if one retry target is missing');
  const partialReuse = reusePartialSelection(
    catalog,
    stableSeed,
    new Set(['dev']),
    1,
    1000
  );
  assert.ok(partialReuse, 'the validated partial DEV snapshot must remain reusable');
  assert.equal(partialReuse.report.targets, 516,
    'all five failed DEV accounts must remain in the next bounded retry wave');
  assert.equal(partialReuse.report.publishedAccounts, 511);
  assert.equal(partialReuse.report.failures, 5);
  assert.ok(generated.counts.eligibleProfiles >= 1000);
  assert.ok(generated.counts.eligibleWorks >= 1000);
  assert.equal(generated.methodology.automated, true);
  assert.equal(generated.methodology.personhoodVerified, false);
  assert.equal(generated.methodology.legalIdentityVerified, false);
  assert.equal(generated.methodology.profileObservationRule, 'identity-entity-only-v1');
  assert.deepEqual(generated.methodology.profileProviders, ['github', 'dev']);
  assert.deepEqual(Object.keys(generated.counts.providerDistribution).sort(), ['dev', 'github']);
  assert.equal(generated.methodology.providerAccountTypeRule, 'github-official-owner-type-user-required-v1');
  assert.equal(generated.counts.rejected.missingAuthoritativeAccountType, 0);
  const githubIdentities = catalog.platformIdentities.filter((row) => row.provider === 'github');
  assert.equal(generated.counts.authoritativeAccountTypeCoverage.github.missing, 0);
  assert.equal(generated.counts.authoritativeAccountTypeCoverage.github.user
    + generated.counts.authoritativeAccountTypeCoverage.github.organization, githubIdentities.length);
  const observationsById = new Map(catalog.metricObservations.map((row) => [row.id, row]));
  for (const entry of generated.entries) {
    const observation = observationsById.get(entry.referenceObservationId);
    assert.ok(observation, `${entry.referenceObservationId} missing from retained catalog`);
    assert.equal(observation.entityType, 'identity');
    assert.equal(observation.entityId, entry.identityId);
    assert.equal(observation.provider, entry.provider);
    assert.equal(observation.methodologyVersion, entry.provider === 'github'
      ? 'github-rest-v3-user-profile-v1' : 'forem-api-v1-public-user-articles-v1');
    assert.equal(observation.metric, entry.provider === 'github' ? 'followers' : 'published_posts');
    assert.ok(entry.evidenceUrls.includes(observation.sourceUrl));
    assert.equal(entry.personhoodVerified, false);
    assert.equal(entry.legalIdentityVerified, false);
  }
  const profileCheckpoint = catalog.acquisitionCheckpoints.tradesProfileMetrics;
  assert.equal(profileCheckpoint.state, 'partial');
  const validatedIdentityMetricAccounts = Object.values(profileCheckpoint.providers)
    .reduce((sum, row) => sum + row.published.totalAccounts, 0);
  assert.equal(profileCheckpoint.validatedIdentityMetricAccounts, validatedIdentityMetricAccounts);
  assert.equal('eligibleIdentityAccounts' in profileCheckpoint, false,
    'acquired identity metrics must not be mislabeled as market eligibility');
  assert.ok(generated.counts.providerDistribution.dev
    <= profileCheckpoint.providers.dev.published.totalAccounts,
  'market screening may exclude a validated metric account without rewriting acquisition truth');
  assert.ok(generated.counts.eligibleProfiles < validatedIdentityMetricAccounts,
    'the market registry must stay stricter than the acquisition snapshot');
  assert.equal(profileCheckpoint.providers.dev.currentAttempt.acquiredAccounts
    + profileCheckpoint.providers.dev.currentAttempt.failures,
  profileCheckpoint.providers.dev.currentAttempt.candidates);

  const githubEntry = generated.entries.find((row) => row.provider === 'github');
  assert.ok(githubEntry, 'expected an eligible GitHub User account');
  const githubIdentityIndex = catalog.platformIdentities.findIndex((row) => row.id === githubEntry.identityId);
  const missingTypeCatalog = structuredClone(catalog);
  delete missingTypeCatalog.platformIdentities[githubIdentityIndex].accountType;
  const missingType = buildTradesEligibility(missingTypeCatalog);
  assert.equal(missingType.entries.some((row) => row.creatorId === githubEntry.creatorId), false);
  assert.equal(missingType.counts.rejected.missingAuthoritativeAccountType,
    generated.counts.rejected.missingAuthoritativeAccountType + 1);

  missingTypeCatalog.platformIdentities[githubIdentityIndex].accountType = 'organization';
  const organization = buildTradesEligibility(missingTypeCatalog);
  assert.equal(organization.entries.some((row) => row.creatorId === githubEntry.creatorId), false);
  assert.equal(organization.counts.rejected.authoritativeProviderOrganization,
    generated.counts.rejected.authoritativeProviderOrganization + 1);
});

test('high-confidence organization and product accounts stay outside creator-account markets', () => {
  const identitiesById = new Map(catalog.platformIdentities.map((row) => [row.id, row]));
  for (const person of baseline.people) {
    assert.equal(KNOWN_NON_PERSON_ACCOUNTS.has(person.name.toLowerCase()), false, person.name);
    assert.equal(KNOWN_NON_PERSON_ACCOUNTS.has(person.handle.replace(/^@/, '').toLowerCase()), false, person.handle);
    if (person.provider === 'github') {
      const retainedType = identitiesById.get(person.accounts[0].id).accountType;
      assert.equal(retainedType, 'user');
      assert.equal(person.accountEligibility.sourceAccountType, 'user');
    }
  }
  assert.ok(catalog.creators.some((row) => KNOWN_NON_PERSON_ACCOUNTS.has(String(row.displayName || '').toLowerCase())),
    'Discovery should retain non-person accounts while Trades excludes them');
  for (const handle of ['nova-agent', 'aigclink', 'fuxicodex', 'ddosi', 'fufankeji']) {
    const identity = catalog.platformIdentities.find((row) => String(row.handle || row.nativeId || '').toLowerCase() === handle);
    assert.ok(identity, `${handle} should remain available to the research catalog`);
    assert.equal(baseline.people.some((person) => person.accounts.some((account) => account.id === identity.id)), false,
      `${handle} is an exact non-person exclusion and must not become a Profile market`);
  }
});

test('Trades evidence remains byte-for-field exact while simulation stays namespaced', () => {
  const rawById = new Map(catalog.metricObservations.map((row) => [row.id, row]));
  const evidence = baseline.people.flatMap((row) => row.metrics).concat(baseline.contents.flatMap((row) => row.metrics));
  assert.ok(evidence.length >= 1000);
  for (const metric of evidence) {
    const raw = rawById.get(metric.id);
    assert.ok(raw);
    assert.equal(metric.value, raw.value);
    assert.equal(metric.unit, raw.unit);
    assert.equal(metric.observedAt, raw.observedAt);
    assert.equal(metric.sourceUrl, raw.sourceUrl);
    assert.equal('supportPriceCents' in metric, false);
    assert.equal('target' in metric, false);
  }
  const first = baseline.contents[0];
  assert.equal(first.contract.metric.observationId, first.metrics.find((row) => row.id === first.contract.metric.observationId).id);
  assert.equal(first.contract.baseline.value, rawById.get(first.contract.metric.observationId).value);
  const standardObservationIds = baseline.people.concat(baseline.contents)
    .map((row) => row.contract.metric.observationId);
  assert.equal(uniqueCount(standardObservationIds), standardObservationIds.length,
    'Profile and Content contracts must never share a retained observation');
  const profile = baseline.people[0];
  const exactProfileEvidence = profile.metrics.filter((row) => row.id === profile.contract.metric.observationId);
  assert.equal(exactProfileEvidence.length, 1);
  assert.deepEqual(profile.simulation,
    model.simulatedMarket('profile', profile.id, exactProfileEvidence, BUCKET, profile.contract.id),
    'Profile quote replay must be keyed only to the registry-pinned identity observation');
  const unrelatedMetric = profile.metrics.find((row) => row.id !== profile.contract.metric.observationId);
  if (unrelatedMetric) {
    const changed = profile.metrics.map((row) => row.id === unrelatedMetric.id ? { ...row, value: row.value + 999 } : row);
    assert.deepEqual(profile.simulation,
      model.simulatedMarket('profile', profile.id,
        changed.filter((row) => row.id === profile.contract.metric.observationId), BUCKET, profile.contract.id));
  }
});

test('hour-bucketed paper market is reproducible and progresses without mutating evidence', () => {
  const first = baseline.contents[0];
  const contractEvidence = first.metrics.filter((row) => row.id === first.contract.metric.observationId);
  assert.equal(contractEvidence.length, 1);
  const same = model.simulatedMarket('content', first.id, contractEvidence, BUCKET, first.contract.id);
  const next = model.simulatedMarket('content', first.id, contractEvidence, '2026-08-21T09:00:00.000Z', first.contract.id);
  assert.deepEqual(first.simulation, same);
  assert.notDeepEqual(
    { price: same.supportPriceCents, volume: same.simulatedVolume, series: same.series },
    { price: next.supportPriceCents, volume: next.simulatedVolume, series: next.series }
  );
  assert.equal(next.bucketEndsAt, '2026-08-21T10:00:00.000Z');
});

test('device-local signals deterministically personalize the full pool', () => {
  const personTarget = baseline.people.at(-1);
  const contentTarget = baseline.contents.at(-1);
  const people = model.rankPeople(baseline.people, { watchedPersonIds: [personTarget.id] });
  const contents = model.rankContents(baseline.contents, { watchedContentIds: [contentTarget.id] });
  assert.equal(people[0].id, personTarget.id);
  assert.equal(people[0].personalized, true);
  assert.equal(contents[0].id, contentTarget.id);
  assert.equal(contents[0].personalized, true);
  assert.match(contents[0].personalizationReasons.join(' '), /Work watched in Trades/i);

  const storage = {
    getItem(key) {
      if (key === 'backer_trades_positions_v1') return JSON.stringify([{ subjectId: personTarget.id }]);
      if (key === 'backer_trades_work_watch_v1') return JSON.stringify([contentTarget.id]);
      if (key === 'backer_portfolio_v1') return JSON.stringify([{ id: 'legacy-fixture-market' }]);
      return '[]';
    }
  };
  const signals = model.signalsFromStorage(storage, []);
  assert.equal(signals.positionSubjectIds.has(personTarget.id), true);
  assert.equal(signals.watchedContentIds.has(contentTarget.id), true);
  assert.equal(signals.positionSubjectIds.has('legacy-fixture-market'), false);
});

test('eligibility mismatches fail closed and a missing registry cannot publish', () => {
  const mismatched = JSON.parse(JSON.stringify(eligibilityRegistry));
  mismatched.entries[0].nativeId = 'wrong-native-id';
  const result = model.build(catalog, { eligibilityRegistry: mismatched, simulationBucket: BUCKET });
  assert.equal(result.people.some((row) => row.id === eligibilityRegistry.entries[0].creatorId), false);
  assert.equal(result.accountEligibility.rejectedCount, 1);
  const contentObservation = catalog.metricObservations.find((row) => row.entityType === 'content');
  const wrongEntity = JSON.parse(JSON.stringify(eligibilityRegistry));
  wrongEntity.entries[0].referenceObservationId = contentObservation.id;
  const wrongEntityResult = model.build(catalog, { eligibilityRegistry: wrongEntity, simulationBucket: BUCKET });
  assert.equal(wrongEntityResult.people.some((row) => row.id === wrongEntity.entries[0].creatorId), false);
  const wrongWork = JSON.parse(JSON.stringify(eligibilityRegistry));
  wrongWork.workEntries[0].referenceObservationId = wrongEntity.entries[0].referenceObservationId;
  const wrongWorkResult = model.build(catalog, { eligibilityRegistry: wrongWork, simulationBucket: BUCKET });
  assert.equal(wrongWorkResult.contents.some((row) => row.id === wrongWork.workEntries[0].contentId), false);
  assert.equal(wrongWorkResult.accountEligibility.rejectedWorkCount, 1);
  assert.throws(() => model.build(catalog, { simulationBucket: BUCKET }), /account-eligibility registry/i);
});

test('lightweight eligibility index is exact and fails closed like the full Trades projection', () => {
  const index = model.eligibility(catalog, eligibilityRegistry);
  assert.deepEqual(index.personIds, baseline.people.map((row) => row.id).slice().sort());
  assert.deepEqual(index.workIds, baseline.contents.map((row) => row.id).slice().sort());

  const mismatched = JSON.parse(JSON.stringify(eligibilityRegistry));
  mismatched.entries[0].nativeId = 'wrong-native-id';
  mismatched.workEntries[0].referenceObservationId = mismatched.entries[0].referenceObservationId;
  const rejected = model.eligibility(catalog, mismatched);
  assert.equal(rejected.personIds.includes(mismatched.entries[0].creatorId), false);
  assert.equal(rejected.workIds.includes(mismatched.workEntries[0].contentId), false);
  assert.throws(() => model.eligibility(catalog, null), /account-eligibility registry/i);
});

test('browser loader fetches the retained catalog and account-eligibility registry', async () => {
  const seen = [];
  const result = await model.load({
    simulationBucket: BUCKET,
    fetch: async (url, options) => {
      seen.push({ url, options });
      return { ok: true, json: async () => url === model.CATALOG_URL ? catalog : eligibilityRegistry };
    }
  });
  assert.deepEqual(seen.map((row) => row.url), [model.CATALOG_URL, model.ELIGIBILITY_URL]);
  assert.ok(seen.every((row) => row.options.cache === 'no-cache' && row.options.credentials === 'same-origin'));
  assert.equal(result.people.length, eligibilityRegistry.counts.eligibleProfiles);
  assert.equal(result.contents.length, eligibilityRegistry.counts.eligibleWorks);
});
