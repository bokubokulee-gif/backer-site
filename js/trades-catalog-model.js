/* Backer Trades catalog model.
   Projects the retained Discovery catalog into real profile/work subjects.
   Source evidence and deterministic simulation state stay strictly separate. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.BackerTradeCatalog = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function () {
  'use strict';

  var CATALOG_URL = 'data/discovery-catalog.json';
  var REVIEW_URL = 'data/trades-reviewed-humans.json';
  var SCHEMA_VERSION = 'backer-trades-catalog-v1';
  var REVIEW_SCHEMA_VERSION = 'backer-reviewed-humans-v1';
  var SIMULATION_MODEL_VERSION = 'backer-support-market-hourly-v1';
  var ORGANIZATION_WORDS = /(?:\b(?:agency|association|collective|community|company|corp(?:oration)?|foundation|group|institute|labs?|media|network|official|organization|podcast|press|staff|studio|team|technologies|technology|university)\b|(?:^|[-_])(?:ai|inc|llc|org)(?:$|[-_]))/i;

  function clean(value) { return String(value == null ? '' : value).trim(); }
  function array(value) { return Array.isArray(value) ? value : []; }
  function finite(value) {
    if (value === '' || value == null) return null;
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : null;
  }
  function safeURL(value) {
    var raw = clean(value);
    if (!raw) return '';
    try {
      var parsed = new URL(raw);
      if ((parsed.protocol !== 'https:' && parsed.protocol !== 'http:') || parsed.username || parsed.password) return '';
      return parsed.href;
    } catch (error) { return ''; }
  }
  function iso(value) {
    var parsed = new Date(value);
    return isNaN(parsed.getTime()) ? '' : parsed.toISOString();
  }
  function newest(values) {
    return array(values).reduce(function (latest, value) {
      var normalized = iso(value);
      return normalized && (!latest || normalized > latest) ? normalized : latest;
    }, '');
  }
  function unique(values) {
    var seen = Object.create(null);
    return array(values).filter(function (value) {
      var key = clean(value);
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }
  function label(value) {
    return clean(value).replace(/[_-]+/g, ' ').replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
  }
  function stableHash(value) {
    var input = clean(value);
    var hash = 2166136261;
    for (var i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }
  function seededNumber(seed) {
    var value = seed >>> 0;
    return function () {
      value += 0x6D2B79F5;
      var next = value;
      next = Math.imul(next ^ (next >>> 15), next | 1);
      next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
      return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
    };
  }
  function exactObservation(row) {
    if (!row || clean(row.availability || 'available').toLowerCase() !== 'available') return null;
    var value = finite(row.value);
    var sourceUrl = safeURL(row.sourceUrl || row.source_url);
    var observedAt = iso(row.observedAt || row.observed_at);
    var id = clean(row.id);
    var entityType = clean(row.entityType || row.entity_type).toLowerCase();
    var entityId = clean(row.entityId || row.entity_id);
    var provider = clean(row.provider || row.platform).toLowerCase();
    var metric = clean(row.metric || row.key).toLowerCase();
    if (!id || !entityType || !entityId || !provider || !metric || value == null || !sourceUrl || !observedAt) return null;
    return {
      id: id,
      entityType: entityType,
      entityId: entityId,
      provider: provider,
      metric: metric,
      key: metric,
      label: label(metric),
      value: value,
      unit: clean(row.unit || 'count'),
      window: row.window == null ? null : clean(row.window),
      observedAt: observedAt,
      sourceUrl: sourceUrl,
      visibility: clean(row.visibility || 'public'),
      access: clean(row.access || 'public_source'),
      methodologyVersion: clean(row.methodologyVersion || row.methodology_version),
      freshness: row.freshness && typeof row.freshness === 'object' ? Object.assign({}, row.freshness) : null,
      confidence: row.confidence && typeof row.confidence === 'object' ? Object.assign({}, row.confidence) : null
    };
  }
  function observationOrder(a, b) {
    return b.observedAt.localeCompare(a.observedAt) || a.provider.localeCompare(b.provider)
      || a.metric.localeCompare(b.metric) || a.id.localeCompare(b.id);
  }
  function evidenceFingerprint(observations) {
    return array(observations).slice().sort(function (a, b) { return a.id.localeCompare(b.id); }).map(function (row) {
      return [row.id, row.value, row.unit, row.observedAt].join(':');
    }).join('|');
  }
  function utcHourBucket(value) {
    var parsed = value == null || value === '' ? new Date() : new Date(value);
    if (isNaN(parsed.getTime())) throw new Error('Invalid Trades simulation bucket');
    parsed.setUTCMinutes(0, 0, 0);
    return parsed.toISOString();
  }
  function simulationPoint(subjectKind, subjectId, observations, bucket, modelVersion, contractId) {
    var evidence = evidenceFingerprint(observations);
    var subjectSeed = stableHash([modelVersion, contractId || '', subjectKind, subjectId, evidence].join('|'));
    var bucketSeed = stableHash([subjectSeed, bucket].join('|'));
    var base = 24 + (subjectSeed % 53);
    var random = seededNumber(bucketSeed);
    var hour = Math.floor(Date.parse(bucket) / (60 * 60 * 1000));
    var phase = subjectSeed % 144;
    var cycle = Math.sin((hour + phase) * Math.PI / 12) * 4
      + Math.sin((hour + (phase % 48)) * Math.PI / 48) * 3;
    var noise = random() * 2 - 1;
    return Math.max(5, Math.min(95, Math.round(base + cycle + noise)));
  }
  function simulatedMarket(subjectKind, subjectId, observations, bucketInput, contractId) {
    var bucket = utcHourBucket(bucketInput);
    var bucketTime = Date.parse(bucket);
    var previousDayBucket = new Date(bucketTime - 24 * 60 * 60 * 1000).toISOString();
    var supportPriceCents = simulationPoint(subjectKind, subjectId, observations, bucket, SIMULATION_MODEL_VERSION, contractId);
    var previousPrice = simulationPoint(subjectKind, subjectId, observations, previousDayBucket, SIMULATION_MODEL_VERSION, contractId);
    var move24hPoints = Math.round((supportPriceCents - previousPrice) * 10) / 10;
    var random = seededNumber(stableHash([SIMULATION_MODEL_VERSION, contractId || '', subjectKind, subjectId,
      evidenceFingerprint(observations), bucket, 'depth'].join('|')));
    var simulatedVolume = 750 + Math.floor(random() * 49250);
    var liquidityDepth = 20 + Math.floor(random() * 81);
    var sparkline = [];
    var series = [];
    for (var i = 15; i >= 0; i -= 1) {
      var pointBucket = new Date(bucketTime - i * 60 * 60 * 1000).toISOString();
      var point = simulationPoint(subjectKind, subjectId, observations, pointBucket, SIMULATION_MODEL_VERSION, contractId);
      sparkline.push(point);
      series.push({ bucket: pointBucket, supportPriceCents: point });
    }
    return {
      isSimulation: true,
      label: 'Simulated market',
      contractId: clean(contractId),
      modelVersion: SIMULATION_MODEL_VERSION,
      methodology: 'deterministic_subject_evidence_utc_hour_v1',
      bucket: bucket,
      bucketEndsAt: new Date(bucketTime + 60 * 60 * 1000).toISOString(),
      previousDayBucket: previousDayBucket,
      supportPriceCents: supportPriceCents,
      move24hPoints: move24hPoints,
      simulatedVolume: simulatedVolume,
      liquidityDepth: liquidityDepth,
      sparkline: sparkline,
      series: series
    };
  }
  function proposalHref(kind, personId, contentId) {
    var params = ['type=' + encodeURIComponent(kind === 'content' ? 'content-growth' : 'person-growth'),
      'person=' + encodeURIComponent(personId), 'source=trades'];
    if (contentId) params.splice(2, 0, 'content=' + encodeURIComponent(contentId));
    return 'backercreate.html#draft?' + params.join('&');
  }
  function researchHref(personId, contentId) {
    var params = ['view=radar', 'person=' + encodeURIComponent(personId)];
    if (contentId) params.push('work=' + encodeURIComponent(contentId));
    return 'backerdemo.html#market2?' + params.join('&');
  }
  function metricPriority(metric) {
    var key = clean(metric && metric.metric).toLowerCase();
    if (/^(?:followers?|subscribers?)$/.test(key)) return 100;
    if (/views?/.test(key)) return 90;
    if (/likes?|reactions?/.test(key)) return 80;
    if (/comments?/.test(key)) return 70;
    if (/shares?/.test(key)) return 60;
    if (/stars?|forks?/.test(key)) return 50;
    if (/videos?_observed/.test(key)) return 20;
    return 30;
  }
  function contractObservation(observations) {
    return array(observations).slice().sort(function (a, b) {
      return metricPriority(b) - metricPriority(a) || observationOrder(a, b);
    })[0] || null;
  }
  function countLabel(value, unit) {
    var number = finite(value);
    if (number == null) return '';
    var rounded = Math.round(number * 10) / 10;
    var formatted = Math.abs(rounded) >= 1000
      ? Math.round(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      : String(rounded);
    return formatted + (clean(unit).toLowerCase() === 'count' ? '' : ' ' + clean(unit));
  }
  function targetForObservation(subjectId, observation) {
    var baseline = observation.value;
    var seed = stableHash(['backer-growth-contract-v1', subjectId, observation.id].join('|'));
    var multiplier = Math.round((1.08 + (seed % 18) / 100) * 100) / 100;
    var magnitude = baseline > 0 ? Math.floor(Math.log(baseline) / Math.LN10) : 0;
    var roundingStep = Math.max(1, Math.pow(10, Math.max(0, magnitude - 1)));
    var value = Math.ceil((baseline * multiplier) / roundingStep) * roundingStep;
    if (value <= baseline) value = baseline + roundingStep;
    return { value: value, multiplier: multiplier, roundingStep: roundingStep };
  }
  function growthContract(kind, subjectId, subjectName, observation, referenceContent) {
    if (!observation) return null;
    var target = targetForObservation(subjectId, observation);
    var horizonOptions = [30, 60, 90];
    var horizonDays = horizonOptions[stableHash([subjectId, observation.id, 'horizon'].join('|')) % horizonOptions.length];
    var cutoffTime = Date.parse(observation.observedAt) + horizonDays * 24 * 60 * 60 * 1000;
    var cutoff = new Date(cutoffTime).toISOString();
    var providerLabel = label(observation.provider);
    var metricLabel = label(observation.metric);
    var baselineLabel = countLabel(observation.value, observation.unit);
    var targetLabel = countLabel(target.value, observation.unit);
    var referenceTitle = clean(referenceContent && referenceContent.title);
    var subjectLabel = referenceTitle ? clean(subjectName) + '\u2019s \u201c' + referenceTitle + '\u201d' : clean(subjectName);
    var question = 'Will ' + subjectLabel + ' reach ' + targetLabel + ' ' + metricLabel.toLowerCase()
      + ' on ' + providerLabel + ' by ' + cutoff.slice(0, 10) + '?';
    var contractId = ['paper-growth', kind, subjectId, observation.id].join(':');
    var resolutionRule = 'Resolve BACK if the same provider reports at least ' + targetLabel + ' '
      + metricLabel.toLowerCase() + ' for the referenced subject in the first retained public observation at or after '
      + cutoff + ' and within the seven-day observation grace period; otherwise resolve FADE.';
    return {
      id: contractId,
      marketKey: contractId,
      modelVersion: 'backer-growth-contract-v1',
      isSimulation: true,
      subjectKind: kind,
      subjectId: subjectId,
      question: question,
      claim: question.replace(/\?$/, '.'),
      baseline: {
        value: observation.value,
        label: baselineLabel,
        observedAt: observation.observedAt
      },
      target: {
        value: target.value,
        label: targetLabel,
        multiplier: target.multiplier,
        roundingStep: target.roundingStep,
        derivation: 'baseline_times_deterministic_multiplier_rounded_up'
      },
      cutoff: cutoff,
      horizonDays: horizonDays,
      metric: {
        key: observation.metric,
        label: metricLabel,
        unit: observation.unit,
        provider: observation.provider,
        sourceUrl: observation.sourceUrl,
        observationId: observation.id,
        entityType: observation.entityType,
        entityId: observation.entityId
      },
      referenceWork: referenceContent ? {
        id: referenceContent.id,
        title: referenceContent.title,
        url: referenceContent.url
      } : null,
      outcomes: [
        { id: 'back', label: 'BACK', condition: 'target_met' },
        { id: 'fade', label: 'FADE', condition: 'target_not_met' }
      ],
      resolutionRule: resolutionRule,
      voidRules: [
        'No retained public observation from the same provider during the seven-day grace period.',
        'The source is removed, access-restricted, or ownership is disputed before resolution.',
        'The provider materially changes the referenced metric definition.'
      ],
      correctionRules: [
        'Use the earliest retained public observation at or after cutoff from the same provider.',
        'Apply a documented provider correction before final resolution.',
        'Never substitute a cross-platform metric or an inferred value.'
      ]
    };
  }
  function organizationLike(person) {
    var name = clean(person && person.name);
    var handle = clean(person && person.handle).replace(/^@/, '');
    if (ORGANIZATION_WORDS.test(name) || ORGANIZATION_WORDS.test(handle)) return true;
    if (/\b(?:department of|school of|the .* blog|made by google|associated press|microsoft|github|deepseek|moonshot|minimax|youtube creators)\b/i.test(name)) return true;
    return false;
  }
  function normalizeSignalIds(values) {
    return new Set(array(values).map(function (value) {
      if (value && typeof value === 'object') return clean(value.subjectId || value.id || value.personId || value.creatorId || value.contentId);
      return clean(value);
    }).filter(Boolean));
  }
  function normalizeSignals(value) {
    var input = value && typeof value === 'object' ? value : {};
    var recent = array(input.recentActions || input.interests).filter(function (row) { return row && typeof row === 'object'; }).slice(0, 40);
    var providerAffinity = Object.create(null);
    recent.forEach(function (row, index) {
      var provider = clean(row.provider).toLowerCase();
      if (provider) providerAffinity[provider] = (providerAffinity[provider] || 0) + Math.max(1, 40 - index);
    });
    if (input.providerAffinity && typeof input.providerAffinity === 'object') Object.keys(input.providerAffinity).forEach(function (provider) {
      var value = finite(input.providerAffinity[provider]);
      if (value != null && value > 0) providerAffinity[clean(provider).toLowerCase()] = value;
    });
    return {
      watchedPersonIds: normalizeSignalIds(input.watchedPersonIds || input.discoveryWatches),
      watchedContentIds: normalizeSignalIds(input.watchedContentIds || input.watchedWorkIds),
      proposedPersonIds: normalizeSignalIds(input.proposedPersonIds),
      proposedContentIds: normalizeSignalIds(input.proposedContentIds),
      positionSubjectIds: normalizeSignalIds(input.positionSubjectIds),
      recentActions: recent,
      providerAffinity: providerAffinity
    };
  }
  function personalizationFor(candidate, signals) {
    var reasons = [];
    var weight = 0;
    var personId = clean(candidate.personId || candidate.id);
    var contentId = candidate.kind === 'content' ? clean(candidate.id) : '';
    if (signals.proposedContentIds.has(contentId)) { weight += 120000; reasons.push('Proposal saved for this work'); }
    if (signals.proposedPersonIds.has(personId)) { weight += 110000; reasons.push('Proposal saved for this creator'); }
    if (signals.positionSubjectIds.has(contentId) || signals.positionSubjectIds.has(personId)) { weight += 100000; reasons.push('Used in a simulation on this device'); }
    if (contentId && signals.watchedContentIds.has(contentId)) { weight += 250000; reasons.push('Work watched in Trades'); }
    if (signals.watchedPersonIds.has(personId)) { weight += 90000; reasons.push('Creator watched in Discovery'); }
    signals.recentActions.forEach(function (row, index) {
      var decay = Math.max(1, 40 - index);
      if (contentId && clean(row.contentId) === contentId) { weight += 1000 * decay; reasons.push('Recently opened in Discovery'); }
      else if (clean(row.personId) === personId) { weight += 500 * decay; reasons.push('More from a recent Discovery profile'); }
    });
    var providerWeight = finite(signals.providerAffinity[clean(candidate.provider).toLowerCase()]) || 0;
    if (providerWeight > 0) { weight += providerWeight * 25; reasons.push('Matches recent ' + label(candidate.provider) + ' activity'); }
    return { weight: weight, reasons: unique(reasons).slice(0, 3) };
  }
  function defaultReason(candidate) {
    if (candidate.metrics && candidate.metrics.length) return 'Retained native observation';
    if (candidate.relatedMetrics && candidate.relatedMetrics.length) return 'Source-linked work evidence';
    return 'Retained public source';
  }
  function rankCandidates(rows, signals, kind) {
    var normalized = normalizeSignals(signals);
    return array(rows).map(function (row, index) {
      var personal = personalizationFor(row, normalized);
      var media = kind === 'content' ? clean(row.thumbnail) : clean(row.avatar);
      var evidenceCount = array(row.metrics).length + array(row.relatedMetrics).length;
      var observedAt = iso(row.lastObservedAt || row.observedAt || row.publishedAt);
      var time = observedAt ? Date.parse(observedAt) : 0;
      var organizationPenalty = kind === 'profile' && organizationLike(row) ? 1 : 0;
      return {
        row: Object.assign({}, row, {
          personalized: personal.reasons.length > 0,
          personalizationReasons: personal.reasons.length ? personal.reasons : [defaultReason(row)]
        }),
        personalWeight: personal.weight,
        media: media ? 1 : 0,
        evidenceCount: evidenceCount,
        organizationPenalty: organizationPenalty,
        time: time,
        index: index
      };
    }).sort(function (a, b) {
      var personalized = b.personalWeight - a.personalWeight;
      if (personalized) return personalized;
      var media = b.media - a.media;
      if (media) return media;
      var organization = a.organizationPenalty - b.organizationPenalty;
      if (organization) return organization;
      /* Without device signals, preserve the reviewed registry/catalog order so
         Trades opens on clearly human creator-person accounts. Personal signals
         still dominate this order as soon as the user watches, opens, or trades. */
      if (a.personalWeight === 0 && b.personalWeight === 0 && a.index !== b.index) return a.index - b.index;
      return b.evidenceCount - a.evidenceCount || b.time - a.time || a.index - b.index
        || clean(a.row.id).localeCompare(clean(b.row.id));
    }).map(function (entry) { return entry.row; });
  }
  function parseStoredArray(storage, key) {
    try {
      var parsed = JSON.parse(storage && storage.getItem ? storage.getItem(key) || '[]' : '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) { return []; }
  }
  function signalsFromStorage(storage, proposalRows) {
    var watched = parseStoredArray(storage, 'backer_market2_watch_v1');
    var watchedContent = parseStoredArray(storage, 'backer_trades_work_watch_v1');
    var recent = parseStoredArray(storage, 'backer_discovery_interest_v1');
    var positions = parseStoredArray(storage, 'backer_trades_positions_v1');
    var proposedPersonIds = [];
    var proposedContentIds = [];
    array(proposalRows).forEach(function (row) {
      var draft = row && row.draft ? row.draft : row;
      var subject = draft && draft.subject || {};
      if (subject.person && subject.person.id) proposedPersonIds.push(subject.person.id);
      if (subject.content && subject.content.id) proposedContentIds.push(subject.content.id);
    });
    return normalizeSignals({
      watchedPersonIds: watched,
      watchedContentIds: watchedContent,
      proposedPersonIds: proposedPersonIds,
      proposedContentIds: proposedContentIds,
      positionSubjectIds: positions,
      recentActions: recent
    });
  }
  function normalizeReviewRegistry(raw, creatorsById, identityById) {
    if (!raw || typeof raw !== 'object' || clean(raw.schemaVersion || raw.schema_version) !== REVIEW_SCHEMA_VERSION) {
      throw new Error('Invalid reviewed-human registry');
    }
    var byCreator = Object.create(null);
    var approved = [];
    var rejected = [];
    var seenIdentity = Object.create(null);
    array(raw.entries).forEach(function (row, index) {
      var creatorId = clean(row && (row.creatorId || row.creator_id));
      var identityId = clean(row && (row.identityId || row.identity_id));
      var provider = clean(row && row.provider).toLowerCase();
      var nativeId = clean(row && (row.nativeId || row.native_id));
      var profileUrl = safeURL(row && (row.profileUrl || row.profile_url));
      var reviewedAt = iso(row && (row.reviewedAt || row.reviewed_at));
      var methodology = clean(row && row.methodology);
      var reviewScope = clean(row && (row.reviewScope || row.review_scope));
      var evidenceUrls = unique(array(row && (row.evidenceUrls || row.evidence_urls)).map(safeURL).filter(Boolean));
      var creator = creatorsById[creatorId];
      var identity = identityById[identityId];
      var valid = row && row.reviewState === 'approved' && row.entityKind === 'human'
        && reviewScope === 'public_creator_person_account'
        && methodology === 'public-creator-person-account-review-v1'
        && creator && identity && identity.creatorId === creatorId
        && identity.provider === provider && identity.nativeId === nativeId
        && identity.profileUrl === profileUrl && evidenceUrls.indexOf(profileUrl) >= 0
        && evidenceUrls.length >= 2 && reviewedAt && !byCreator[creatorId] && !seenIdentity[identityId];
      if (!valid) {
        rejected.push({ index: index, creatorId: creatorId, identityId: identityId, reason: 'exact_review_contract_mismatch' });
        return;
      }
      var review = {
        reviewState: 'approved',
        entityKind: 'human',
        reviewScope: reviewScope,
        creatorId: creatorId,
        identityId: identityId,
        provider: provider,
        nativeId: nativeId,
        profileUrl: profileUrl,
        reviewedAt: reviewedAt,
        methodology: methodology,
        evidenceUrls: evidenceUrls,
        legalIdentityVerified: false
      };
      byCreator[creatorId] = review;
      seenIdentity[identityId] = true;
      approved.push(review);
    });
    approved.sort(function (a, b) { return a.creatorId.localeCompare(b.creatorId); });
    return {
      schemaVersion: REVIEW_SCHEMA_VERSION,
      generatedAt: iso(raw.generatedAt || raw.generated_at),
      policy: clean(raw.policy),
      byCreator: byCreator,
      approved: approved,
      rejected: rejected
    };
  }
  function build(raw, options) {
    options = options || {};
    if (!raw || typeof raw !== 'object') throw new Error('Invalid retained Discovery catalog');
    var rawCreators = array(raw.creators);
    var rawIdentities = array(raw.platformIdentities || raw.platform_identities);
    var rawContents = array(raw.contentRecords || raw.content_records);
    var observations = array(raw.metricObservations || raw.metric_observations).map(exactObservation).filter(Boolean);
    if (!rawCreators.length || !rawIdentities.length || !rawContents.length) throw new Error('Retained Discovery catalog is empty');

    var creatorsById = Object.create(null);
    rawCreators.forEach(function (row) {
      var id = clean(row && row.id);
      if (!id || /^(?:demo|fixture|synthetic)[-_]/i.test(id)) return;
      creatorsById[id] = row;
    });
    var observationsByEntity = Object.create(null);
    observations.forEach(function (row) { (observationsByEntity[row.entityId] = observationsByEntity[row.entityId] || []).push(row); });
    Object.keys(observationsByEntity).forEach(function (id) { observationsByEntity[id].sort(observationOrder); });

    var identitiesByCreator = Object.create(null);
    var identityById = Object.create(null);
    rawIdentities.forEach(function (row) {
      var id = clean(row && row.id);
      var creatorId = clean(row && (row.creatorId || row.creator_id));
      var provider = clean(row && (row.provider || row.platform)).toLowerCase();
      var url = safeURL(row && (row.profileUrl || row.profile_url || row.url));
      if (!id || !creatorsById[creatorId] || !provider || !url) return;
      var identity = {
        id: id,
        sourceIdentityId: id,
        creatorId: creatorId,
        provider: provider,
        nativeId: clean(row.nativeId || row.native_id),
        handle: clean(row.handle || row.nativeId || row.native_id),
        url: url,
        profileUrl: url,
        sourceUrl: url,
        verified: row.verified === true,
        observedAt: iso(row.observedAt || row.observed_at),
        metrics: array(observationsByEntity[id]).map(function (metric) { return Object.assign({}, metric); })
      };
      identityById[id] = identity;
      (identitiesByCreator[creatorId] = identitiesByCreator[creatorId] || []).push(identity);
    });
    Object.keys(identitiesByCreator).forEach(function (creatorId) {
      identitiesByCreator[creatorId].sort(function (a, b) { return a.id.localeCompare(b.id); });
    });
    var reviewRegistry = normalizeReviewRegistry(options.reviewRegistry, creatorsById, identityById);
    var reviewedByCreator = reviewRegistry.byCreator;
    var simulationBucket = utcHourBucket(options.simulationBucket || options.now);

    var contentByCreator = Object.create(null);
    var contents = rawContents.map(function (row) {
      var id = clean(row && row.id);
      var creatorId = clean(row && (row.creatorId || row.creator_id));
      var identityId = clean(row && (row.platformIdentityId || row.platform_identity_id));
      var provider = clean(row && (row.provider || row.platform)).toLowerCase();
      var url = safeURL(row && (row.canonicalUrl || row.canonical_url || row.url));
      var creator = creatorsById[creatorId];
      var identity = identityById[identityId];
      var humanReview = reviewedByCreator[creatorId];
      var title = clean(row && row.title);
      if (!id || !creator || !identity || !humanReview || identityId !== humanReview.identityId
        || identity.creatorId !== creatorId || identity.provider !== humanReview.provider || provider !== humanReview.provider
        || !provider || !url || !title
        || /^(?:demo|fixture|synthetic)[-_]/i.test(id)) return null;
      var avatar = safeURL(creator.avatarUrl || creator.avatar_url);
      var avatarSourceUrl = avatar ? safeURL(creator.avatarSourceUrl || creator.avatar_source_url) : '';
      var thumbnail = safeURL(row.thumbnailUrl || row.thumbnail_url);
      var thumbnailSourceUrl = thumbnail ? safeURL(row.thumbnailSourceUrl || row.thumbnail_source_url || url) : '';
      var metrics = array(observationsByEntity[id]).map(function (metric) { return Object.assign({}, metric); });
      if (!avatar || !avatarSourceUrl || !thumbnail || !thumbnailSourceUrl || !metrics.length) return null;
      var person = {
        id: creatorId,
        personId: creatorId,
        name: clean(creator.displayName || creator.display_name || creator.name) || identity.handle,
        handle: identity.handle ? '@' + identity.handle.replace(/^@/, '') : '',
        avatar: avatar,
        avatarSourceUrl: avatarSourceUrl,
        profileUrl: identity.url,
        provider: identity.provider
      };
      var item = {
        id: id,
        contentId: id,
        sourceRecordId: id,
        kind: 'content',
        subjectType: 'content-growth',
        personId: creatorId,
        person: person,
        title: title,
        excerpt: clean(row.excerpt),
        contentType: clean(row.contentType || row.content_type || 'content'),
        provider: provider,
        url: url,
        sourceUrl: url,
        thumbnail: thumbnail && thumbnailSourceUrl ? thumbnail : '',
        thumbnailUrl: thumbnail && thumbnailSourceUrl ? thumbnail : '',
        thumbnailSourceUrl: thumbnailSourceUrl,
        thumbnailRole: clean(row.thumbnailRole || row.thumbnail_role),
        publishedAt: iso(row.publishedAt || row.published_at),
        observedAt: iso(row.observedAt || row.observed_at),
        lastObservedAt: newest([row.observedAt, row.observed_at].concat(metrics.map(function (metric) { return metric.observedAt; }))),
        metrics: metrics,
        publicCounts: metrics,
        humanReview: Object.assign({}, humanReview),
        evidenceState: 'retained_native_observations',
        executionApproved: false,
        simulationOnly: true,
        proposalHref: proposalHref('content', creatorId, id),
        researchHref: researchHref(creatorId, id)
      };
      item.contract = growthContract('content', id, title, contractObservation(metrics), null);
      if (!item.contract) return null;
      item.simulation = simulatedMarket('content', id, metrics, simulationBucket, item.contract.id);
      (contentByCreator[creatorId] = contentByCreator[creatorId] || []).push(item);
      return item;
    }).filter(Boolean);
    Object.keys(contentByCreator).forEach(function (creatorId) {
      contentByCreator[creatorId].sort(function (a, b) {
        return (b.publishedAt || b.observedAt).localeCompare(a.publishedAt || a.observedAt) || a.id.localeCompare(b.id);
      });
    });

    var people = Object.keys(reviewedByCreator).map(function (creatorId) {
      var creator = creatorsById[creatorId];
      var humanReview = reviewedByCreator[creatorId];
      var accounts = array(identitiesByCreator[creatorId]).filter(function (account) {
        return account.id === humanReview.identityId;
      });
      if (!accounts.length) return null;
      var primary = identityById[humanReview.identityId];
      var personMetrics = [];
      accounts.forEach(function (account) { personMetrics = personMetrics.concat(account.metrics); });
      personMetrics.sort(observationOrder);
      var relatedContent = array(contentByCreator[creatorId]);
      var relatedMetrics = [];
      relatedContent.forEach(function (content) { relatedMetrics = relatedMetrics.concat(content.metrics); });
      relatedMetrics.sort(observationOrder);
      var avatar = safeURL(creator.avatarUrl || creator.avatar_url);
      var avatarSourceUrl = avatar ? safeURL(creator.avatarSourceUrl || creator.avatar_source_url || primary.url) : '';
      if (!avatar || !avatarSourceUrl || !relatedContent.length || (!personMetrics.length && !relatedMetrics.length)) return null;
      var leadObservation = contractObservation(personMetrics.concat(relatedMetrics));
      var referenceContent = leadObservation && leadObservation.entityType === 'content'
        ? relatedContent.filter(function (content) { return content.id === leadObservation.entityId; })[0] || null
        : null;
      var person = {
        id: creatorId,
        personId: creatorId,
        kind: 'profile',
        subjectType: 'person-growth',
        name: clean(creator.displayName || creator.display_name || creator.name) || primary.handle || creatorId,
        displayName: clean(creator.displayName || creator.display_name || creator.name),
        handle: primary.handle ? '@' + primary.handle.replace(/^@/, '') : '',
        bio: clean(creator.bio),
        avatar: avatar,
        avatarUrl: avatar,
        avatarSourceUrl: avatarSourceUrl,
        profileUrl: primary.url,
        provider: primary.provider,
        accounts: accounts.map(function (account) { return Object.assign({}, account); }),
        metrics: personMetrics.map(function (metric) { return Object.assign({}, metric); }),
        relatedMetrics: relatedMetrics.map(function (metric) { return Object.assign({}, metric); }),
        leadObservation: leadObservation,
        content: relatedContent.map(function (content) { return content; }),
        contentCount: relatedContent.length,
        observedAt: iso(creator.observedAt || creator.observed_at),
        lastObservedAt: newest([creator.observedAt, creator.observed_at].concat(accounts.map(function (account) { return account.observedAt; }), personMetrics.map(function (metric) { return metric.observedAt; }), relatedMetrics.map(function (metric) { return metric.observedAt; }))),
        identityReview: 'confirmed_public_creator_person_account',
        humanConfirmed: true,
        humanReview: Object.assign({}, humanReview),
        evidenceState: personMetrics.length ? 'retained_native_observations'
          : relatedMetrics.length ? 'related_work_observations' : 'source_linked',
        executionApproved: false,
        simulationOnly: true,
        proposalHref: proposalHref('profile', creatorId, ''),
        researchHref: researchHref(creatorId, '')
      };
      person.contract = growthContract('profile', creatorId, person.name, leadObservation, referenceContent);
      if (!person.contract) return null;
      person.simulation = simulatedMarket('profile', creatorId, personMetrics.concat(relatedMetrics), simulationBucket, person.contract.id);
      return person;
    }).filter(Boolean);

    var rankedPeople = rankCandidates(people, options.signals, 'profile');
    var rankedContents = rankCandidates(contents, options.signals, 'content');
    var feedLimit = Math.max(1, Math.min(100, Number(options.feedLimit) || 48));
    var feed = [];
    var personIndex = 0;
    var contentIndex = 0;
    while (feed.length < feedLimit && (personIndex < rankedPeople.length || contentIndex < rankedContents.length)) {
      if (personIndex < rankedPeople.length) feed.push({ kind: 'profile', id: rankedPeople[personIndex].id, subject: rankedPeople[personIndex++] });
      if (contentIndex < rankedContents.length && feed.length < feedLimit) feed.push({ kind: 'content', id: rankedContents[contentIndex].id, subject: rankedContents[contentIndex++] });
    }
    var retainedSources = Object.create(null);
    rankedPeople.forEach(function (person) {
      person.accounts.forEach(function (account) {
        var source = retainedSources[account.provider] || (retainedSources[account.provider] = { provider: account.provider, profileCount: 0, contentCount: 0, observationCount: 0, lastObservedAt: '' });
        source.profileCount += 1;
        source.observationCount += account.metrics.length;
        source.lastObservedAt = newest([source.lastObservedAt, account.observedAt].concat(account.metrics.map(function (metric) { return metric.observedAt; })));
      });
    });
    rankedContents.forEach(function (content) {
      var source = retainedSources[content.provider] || (retainedSources[content.provider] = { provider: content.provider, profileCount: 0, contentCount: 0, observationCount: 0, lastObservedAt: '' });
      source.contentCount += 1;
      source.observationCount += content.metrics.length;
      source.lastObservedAt = newest([source.lastObservedAt, content.observedAt].concat(content.metrics.map(function (metric) { return metric.observedAt; })));
    });
    var normalizedSignals = normalizeSignals(options.signals);
    var signalCount = normalizedSignals.watchedPersonIds.size + normalizedSignals.watchedContentIds.size + normalizedSignals.proposedPersonIds.size
      + normalizedSignals.proposedContentIds.size + normalizedSignals.positionSubjectIds.size + normalizedSignals.recentActions.length;
    var eligibleObservationIds = Object.create(null);
    rankedPeople.forEach(function (person) {
      person.metrics.concat(person.relatedMetrics).forEach(function (metric) { eligibleObservationIds[metric.id] = true; });
    });
    rankedContents.forEach(function (content) {
      content.metrics.forEach(function (metric) { eligibleObservationIds[metric.id] = true; });
    });
    var simulationBucketEndsAt = new Date(Date.parse(simulationBucket) + 60 * 60 * 1000).toISOString();
    return {
      schemaVersion: SCHEMA_VERSION,
      catalogSchemaVersion: clean(raw.schemaVersion || raw.schema_version || '1'),
      generatedAt: iso(raw.generatedAt || raw.generated_at),
      source: CATALOG_URL,
      reviewSource: REVIEW_URL,
      status: 'reviewed_real_human_subjects',
      simulationDisclosure: 'All support prices, movement, volume, charts, and liquidity shown in Trades are deterministic paper simulations. Creator-person accounts, works, source links, media, and labeled observations come from the retained public catalog.',
      simulationBucket: {
        id: simulationBucket,
        endsAt: simulationBucketEndsAt,
        intervalMs: 60 * 60 * 1000,
        modelVersion: SIMULATION_MODEL_VERSION
      },
      humanReview: {
        schemaVersion: reviewRegistry.schemaVersion,
        generatedAt: reviewRegistry.generatedAt,
        policy: reviewRegistry.policy,
        approvedCount: reviewRegistry.approved.length,
        rejectedCount: reviewRegistry.rejected.length,
        legalIdentityVerified: false
      },
      people: rankedPeople,
      contents: rankedContents,
      feed: feed,
      counts: {
        people: rankedPeople.length,
        contents: rankedContents.length,
        observations: Object.keys(eligibleObservationIds).length,
        catalogObservations: observations.length
      },
      retainedSources: Object.keys(retainedSources).sort().map(function (provider) { return retainedSources[provider]; }),
      personalization: { deviceLocal: true, active: signalCount > 0, signalCount: signalCount }
    };
  }
  function load(options) {
    options = options || {};
    var fetcher = options.fetch || (typeof fetch === 'function' ? fetch : null);
    if (!fetcher) return Promise.reject(new Error('Fetch is unavailable'));
    function fetchJson(url, labelText) {
      return fetcher(url, { cache: 'no-store', credentials: 'same-origin' }).then(function (response) {
        if (!response || !response.ok) throw new Error(labelText + ' HTTP ' + (response && response.status));
        return response.json();
      });
    }
    var catalogPromise = fetchJson(options.url || CATALOG_URL, 'Trades catalog');
    var reviewPromise = options.reviewRegistry
      ? Promise.resolve(options.reviewRegistry)
      : fetchJson(options.reviewUrl || REVIEW_URL, 'Reviewed-human registry');
    return Promise.all([catalogPromise, reviewPromise]).then(function (rows) {
      return build(rows[0], Object.assign({}, options, { reviewRegistry: rows[1] }));
    });
  }

  return {
    CATALOG_URL: CATALOG_URL,
    REVIEW_URL: REVIEW_URL,
    SCHEMA_VERSION: SCHEMA_VERSION,
    REVIEW_SCHEMA_VERSION: REVIEW_SCHEMA_VERSION,
    SIMULATION_MODEL_VERSION: SIMULATION_MODEL_VERSION,
    build: build,
    load: load,
    normalizeSignals: normalizeSignals,
    signalsFromStorage: signalsFromStorage,
    rankPeople: function (rows, signals) { return rankCandidates(rows, signals, 'profile'); },
    rankContents: function (rows, signals) { return rankCandidates(rows, signals, 'content'); },
    simulatedMarket: simulatedMarket,
    utcHourBucket: utcHourBucket,
    safeURL: safeURL,
    stableHash: stableHash
  };
});
