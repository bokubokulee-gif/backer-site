'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const test = require('node:test');
const model = require('../js/trades-catalog-model');

const ROOT = path.join(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'discovery-catalog.json'), 'utf8'));
const reviewRegistry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'trades-eligible-accounts.json'), 'utf8'));
const BUCKET = '2026-08-21T08:00:00.000Z';
const FIXTURE = /^(?:demo|fixture|synthetic)(?:[-_\s]|$)/i;

const creatorById = new Map(catalog.creators.map((row) => [row.id, row]));
const identityById = new Map(catalog.platformIdentities.map((row) => [row.id, row]));
const contentById = new Map(catalog.contentRecords.map((row) => [row.id, row]));
const observationById = new Map(catalog.metricObservations.map((row) => [row.id, row]));
const providerRuns = new Map(catalog.providerRuns.map((row) => [String(row.provider).toLowerCase(), row]));
const workEligibilityById = new Map(reviewRegistry.workEntries.map((row) => [row.contentId, row]));

const startedAt = performance.now();
const result = model.build(catalog, { reviewRegistry, simulationBucket: BUCKET, feedLimit: 100 });
const buildDurationMs = performance.now() - startedAt;

function isHttp(value) {
  return /^https?:\/\//.test(String(value || ''));
}

function queryFromHash(href) {
  const value = String(href || '');
  const index = value.indexOf('?');
  return new URLSearchParams(index < 0 ? '' : value.slice(index + 1));
}

function uniqueCount(values) {
  return new Set(values).size;
}

function assertObservationExact(contract) {
  assert.ok(contract && contract.id && contract.metric, 'complete contract required');
  const raw = observationById.get(contract.metric.observationId);
  assert.ok(raw, `${contract.metric.observationId} is not a retained observation`);
  assert.equal(contract.baseline.value, raw.value);
  assert.equal(contract.baseline.observedAt, raw.observedAt);
  assert.equal(contract.metric.unit, raw.unit);
  assert.equal(contract.metric.provider, raw.provider);
  assert.equal(contract.metric.sourceUrl, raw.sourceUrl);
  assert.equal(contract.metric.entityType, raw.entityType);
  assert.equal(contract.metric.entityId, raw.entityId);
  assert.equal(contract.metric.observedAt, raw.observedAt);
  assert.equal(contract.metric.methodologyVersion, raw.methodologyVersion);
  assert.deepEqual(contract.metric.freshness, raw.freshness);
  assert.deepEqual(contract.baseline.freshness, raw.freshness);
  assert.ok(Number.isFinite(contract.target.value) && contract.target.value > contract.baseline.value);
  assert.ok(isHttp(contract.metric.sourceUrl));
  assert.ok(contract.resolutionRule && contract.voidRules.length && contract.correctionRules.length);
  return raw;
}

test('Trades release inventory contains at least 1,000 exact profiles and 1,000 exact work markets', () => {
  assert.ok(result.people.length >= 1000, `expected >=1000 profiles, received ${result.people.length}`);
  assert.ok(result.contents.length >= 1000, `expected >=1000 works, received ${result.contents.length}`);
  assert.equal(reviewRegistry.counts.eligibleProfiles, result.people.length, 'registry profile count must equal projected inventory');
  assert.equal(reviewRegistry.counts.eligibleWorks, result.contents.length, 'registry work count must equal projected inventory');
  assert.equal(reviewRegistry.entries.length, result.people.length, 'one eligible registry entry is required per profile market');
  assert.equal(result.counts.people, result.people.length);
  assert.equal(result.counts.contents, result.contents.length);
  assert.equal(uniqueCount(result.people.map((row) => row.id)), result.people.length, 'profile IDs must be unique');
  assert.equal(uniqueCount(result.contents.map((row) => row.id)), result.contents.length, 'work IDs must be unique');
  const contracts = result.people.concat(result.contents).map((row) => row.contract.id);
  assert.equal(uniqueCount(contracts), contracts.length, 'contract IDs must be unique');
  assert.ok(contracts.length >= 2000);
  assert.ok(buildDurationMs < 3000, `1k + 1k catalog projection took ${Math.round(buildDurationMs)}ms`);
});

test('every profile market is an exact source-backed creator account with identity-native evidence', () => {
  const identityKeys = [];
  const eligibleWorkIds = new Set(result.contents.map((row) => row.id));
  assert.deepEqual(new Set(result.people.map((row) => row.provider)), new Set(['github', 'dev']));

  for (const person of result.people) {
    assert.ok(!FIXTURE.test(person.id) && !FIXTURE.test(person.name));
    assert.ok(creatorById.has(person.id), `${person.id} missing retained creator`);
    assert.equal(person.personId, person.id);
    assert.equal(person.creatorAccount, true);
    assert.equal(person.humanConfirmed, false);
    assert.ok(person.accountEligibility && person.accountEligibility.eligibilityState === 'eligible');
    assert.equal(person.accountEligibility.entityKind, 'creator_account');
    assert.equal(person.accountEligibility.eligibilityScope, 'public_creator_account_shape');
    assert.equal(person.accountEligibility.automatedEligibility, true);
    assert.equal(person.accountEligibility.personhoodVerified, false);
    assert.equal(person.accountEligibility.legalIdentityVerified, false);
    const eligibilityIdentity = identityById.get(person.accountEligibility.identityId);
    const expectedAccountType = person.provider === 'github' ? 'user' : 'creator_account';
    if (person.provider === 'github') assert.equal(eligibilityIdentity.accountType, 'user');
    assert.equal(person.accountEligibility.sourceAccountType, expectedAccountType);
    assert.ok(isHttp(person.profileUrl) && isHttp(person.avatar) && isHttp(person.avatarSourceUrl));
    assert.doesNotMatch(person.avatar, /(?:backer-mark|backer-logo|data:image\/svg)/i);
    assert.equal(person.accounts.length, 1, 'one profile market must resolve to one exact provider identity');

    const account = person.accounts[0];
    const rawIdentity = identityById.get(account.id);
    assert.ok(rawIdentity, `${account.id} missing retained identity`);
    assert.equal(account.creatorId, person.id);
    assert.equal(account.id, person.accountEligibility.identityId);
    assert.equal(account.provider, person.provider);
    assert.equal(account.nativeId, person.accountEligibility.nativeId);
    assert.equal(account.profileUrl, person.profileUrl);
    assert.ok(account.nativeId && isHttp(account.profileUrl));
    identityKeys.push(`${account.provider}:${account.nativeId}`.toLowerCase());

    person.content.forEach((work) => {
      assert.equal(work.personId, person.id);
      assert.ok(eligibleWorkIds.has(work.id));
    });

    const rawObservation = assertObservationExact(person.contract);
    assert.equal(person.contract.subjectId, person.id);
    assert.equal(person.contract.metric.observationId, person.accountEligibility.referenceObservationId);
    assert.equal(rawObservation.entityType, 'identity');
    assert.equal(rawObservation.entityId, account.id, 'profile-native metric must belong to the exact account');
    assert.equal(person.contract.referenceWork, null);

    const research = queryFromHash(person.researchHref);
    assert.equal(research.get('person'), person.id);
    assert.equal(research.has('work'), false);
  }

  assert.equal(uniqueCount(identityKeys), identityKeys.length, 'provider/native identities must not be duplicated');
});

test('every work market preserves exact retained creator/source-account linkage, media, observation, contract, and Discovery route', () => {
  for (const work of result.contents) {
    assert.ok(!FIXTURE.test(work.id) && !FIXTURE.test(work.title));
    const raw = contentById.get(work.id);
    assert.ok(raw, `${work.id} missing retained work`);
    const creator = creatorById.get(raw.creatorId);
    const identity = identityById.get(raw.platformIdentityId);
    const eligibility = workEligibilityById.get(work.id);
    assert.ok(creator, `${work.id} missing retained creator linkage`);
    assert.ok(identity, `${work.id} missing retained source-account linkage`);
    assert.ok(eligibility, `${work.id} missing independent Work eligibility`);
    assert.equal(raw.creatorId, work.personId);
    assert.equal(identity.creatorId, work.personId);
    assert.equal(identity.provider, work.provider);
    assert.equal(work.person.id, creator.id);
    assert.equal(work.person.provider, identity.provider);
    assert.equal(work.workEligibility.identityId, identity.id);
    assert.equal(work.workEligibility.referenceObservationId, eligibility.referenceObservationId);
    assert.equal(work.title, raw.title);
    assert.equal(work.url, raw.canonicalUrl || raw.url);
    assert.ok(isHttp(work.url) && isHttp(work.thumbnail) && isHttp(work.thumbnailSourceUrl));
    assert.equal(work.thumbnailRole, 'content');
    assert.doesNotMatch(work.thumbnail, /(?:backer-mark|backer-logo|data:image\/svg)/i);

    const rawObservation = assertObservationExact(work.contract);
    assert.equal(work.contract.metric.observationId, eligibility.referenceObservationId);
    assert.equal(work.contract.subjectId, work.id);
    assert.equal(rawObservation.entityType, 'content');
    assert.equal(rawObservation.entityId, work.id);

    const research = queryFromHash(work.researchHref);
    assert.equal(research.get('person'), work.personId);
    assert.equal(research.get('work'), work.id);
  }
});

test('Profile and Content standard contracts never reuse the same retained observation', () => {
  const profiles = result.people.map((row) => row.contract.metric.observationId);
  const contents = result.contents.map((row) => row.contract.metric.observationId);
  const profileSet = new Set(profiles);
  assert.equal(profileSet.size, profiles.length, 'profile observation IDs must be unique');
  assert.equal(new Set(contents).size, contents.length, 'content observation IDs must be unique');
  assert.equal(contents.some((id) => profileSet.has(id)), false, 'Profile and Content observations collided');
});

test('retained provider evidence, bounded model feed, and personalization remain coherent at scale', () => {
  for (const source of result.retainedSources) {
    const run = providerRuns.get(source.provider);
    assert.ok(run, `${source.provider} has no provider run`);
    assert.ok(['succeeded', 'partial'].includes(run.state), `${source.provider} did not return substantive data`);
    assert.ok(Number(run.resultCounts && run.resultCounts.creators) > 0);
    assert.ok(Number(run.resultCounts && run.resultCounts.contentRecords) > 0);
    assert.ok(Number(run.resultCounts && run.resultCounts.metricObservations) > 0);
  }

  assert.ok(result.feed.length <= 100, 'model feed must remain bounded');

  const profileTarget = result.people.at(-1);
  const workTarget = result.contents.at(-1);
  const profileIds = new Set(result.people.map((row) => row.id));
  const workIds = new Set(result.contents.map((row) => row.id));
  const rankedProfiles = model.rankPeople(result.people, { watchedPersonIds: [profileTarget.id] });
  const rankedWorks = model.rankContents(result.contents, { watchedContentIds: [workTarget.id] });
  assert.equal(rankedProfiles.length, result.people.length);
  assert.equal(rankedWorks.length, result.contents.length);
  assert.deepEqual(new Set(rankedProfiles.map((row) => row.id)), profileIds);
  assert.deepEqual(new Set(rankedWorks.map((row) => row.id)), workIds);
  assert.equal(rankedProfiles[0].id, profileTarget.id);
  assert.equal(rankedWorks[0].id, workTarget.id);
  assert.deepEqual(model.rankPeople(result.people, {}).map((row) => row.id), result.people.map((row) => row.id));
  assert.deepEqual(model.rankContents(result.contents, {}).map((row) => row.id), result.contents.map((row) => row.id));
});
