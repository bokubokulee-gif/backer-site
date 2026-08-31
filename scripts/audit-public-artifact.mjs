#!/usr/bin/env node

import { lstat, readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = fileURLToPath(import.meta.url);

const REVIEWED_PUBLIC_DATA = Object.freeze({
  'data/discovery-catalog.json': {
    classification: 'public-source discovery projection',
    maxBytes: 12_000_000,
    sha256: '20313199fbd150a7b53891afc635cd0586350e08828191cafccb24779ea4955a'
  },
  'data/landing-preview.json': {
    classification: 'public-source landing projection',
    maxBytes: 20_000,
    sha256: '04b43f71bfd4604967a62b66c531a6ef165cdc3cca2bae6e8183692273fe2e8f'
  },
  'data/market2-people.json': {
    classification: 'public-source marketplace projection',
    maxBytes: 250_000,
    sha256: '1988f09a07d50c53356f9e1570c597018c40bb301cf1ddb2697fe96739a64497'
  },
  'data/trades-eligible-accounts.json': {
    classification: 'public-source eligibility projection',
    maxBytes: 2_500_000,
    sha256: '37af208ed621e498859b2ed533d042d0f7898abcb2ca6ffad08671e7cbd659db'
  },
  'research-lab/data/real-market-snapshot.json': {
    classification: 'dated public prediction-market observations',
    maxBytes: 250_000,
    sha256: '13c06bb395e7f025d001a768b32a9deacdabc1ce48e0566745be1c97f84572e3'
  }
});

const REVIEWED_RESEARCH_SCRIPTS = Object.freeze({
  'research-lab/assets/lab-public-v1.js': {
    classification: 'reviewed aggregate field presenter with anonymous visual markers',
    sha256: '54c286d3f9f44f433cc793650432f8101b9a17869317039ddb1021fbae910bee'
  },
  'research-lab/assets/method-public-v1.js': {
    classification: 'public method navigation and declared-condition explainer without model formulas',
    sha256: '6a0e71a4811963035b30ea19c3bf760bb449464782ca472c2e3453eed4460ed9'
  },
  'research-lab/assets/styles-B29Xo75-.js': {
    classification: 'reviewed public Research presentation support',
    sha256: '160e11dc4903bc5b39674284aee4105460645521181f0e6f55807c8fb6f60ead'
  },
  'research-lab/assets/thesis-6jy8lxCE.js': {
    classification: 'reviewed public Research article renderer',
    sha256: 'd41d3c45fd2fcef77d85cba789c032fe6268d9f474e447f1bf53704b37a2f1c9'
  },
  'research-lab/assets/lab-DPQGlpRQ.js': {
    classification: 'client simulation, order-book, intervention, and forecast engine',
    sha256: '69bd8678dac3d1645cd2a268d46aa932c9a49a0f65c7d9ffefb0673a752b54c4',
    blockedCode: 'research_engine_public',
    blockedMessage: 'The simulation, order-book, intervention, and forecast engine executes in the browser. Move proprietary computation server-side.'
  },
  'research-lab/assets/method-E5oJCIPr.js': {
    classification: 'client Method experiment calculator',
    sha256: '188e3bb055e23818db3ea33baede641aeb4c0508cf613a5456ae0944e971d5c5',
    blockedCode: 'research_method_formula_public',
    blockedMessage: 'The Method workbench computes its experiment result in client code. Use a server-side experiment endpoint for authoritative formulas.'
  },
  'research-lab/assets/styles-CCsHLpTc.js': {
    classification: 'reviewed public Research presentation support',
    sha256: '160e11dc4903bc5b39674284aee4105460645521181f0e6f55807c8fb6f60ead'
  },
  'research-lab/assets/thesis-iVdpij0o.js': {
    classification: 'reviewed public Research article renderer',
    sha256: '9db941dc9ae4814c0dd27582c3e9b8049e82387be01ac9eb393340068a802cb3'
  }
});

const FORBIDDEN_PATHS = Object.freeze([
  { code: 'source_map', pattern: /(?:^|\/)\.?.+\.map$/i, message: 'Production source maps must not be public.' },
  { code: 'environment_file', pattern: /(?:^|\/)\.env(?:\..+)?$/i, message: 'Environment files must not be public.' },
  { code: 'private_key_file', pattern: /\.(?:pem|key|p12|pfx|jks)$/i, message: 'Private key material must not be public.' },
  { code: 'backup_file', pattern: /(?:~|\.bak|\.backup|\.old|\.orig|\.swp)$/i, message: 'Backup/editor files must not be public.' },
  { code: 'internal_tree', pattern: /^(?:api|docs|lib|migrations|scripts|tests|node_modules|\.git)(?:\/|$)/i, message: 'Internal source and operational trees must not be static assets.' },
  { code: 'internal_markdown', pattern: /\.md$/i, message: 'Markdown requires an explicit reviewed public projection before release.' }
]);

const SECRET_PATTERNS = Object.freeze([
  { code: 'private_key_literal', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { code: 'github_token_literal', pattern: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/ },
  { code: 'aws_access_key_literal', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { code: 'stripe_secret_literal', pattern: /\bsk_(?:live|test)_[A-Za-z0-9]{20,}\b/ },
  { code: 'slack_token_literal', pattern: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/ },
  {
    code: 'assigned_secret_literal',
    pattern: /\b(?:api[_-]?key|access[_-]?token|bearer[_-]?token|client[_-]?secret|private[_-]?key|password)\b\s*[:=]\s*["'][^"'\s]{16,}["']/i
  }
]);

const TEXT_EXTENSIONS = new Set(['.css', '.csv', '.html', '.js', '.json', '.mjs', '.svg', '.txt', '.xml']);
const DATA_EXTENSIONS = new Set(['.csv', '.db', '.gz', '.json', '.jsonl', '.ndjson', '.parquet', '.sqlite', '.tsv']);
const MAX_TEXT_INSPECTION_BYTES = 15_000_000;

function finding(severity, code, file, message) {
  return { severity, code, file, message };
}

async function listFiles(root, relative = '') {
  const directory = path.join(root, relative);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = path.posix.join(relative.split(path.sep).join(path.posix.sep), entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(root, child));
    if (entry.isFile() || entry.isSymbolicLink()) files.push(child);
  }
  return files.sort();
}

function isDataPath(relativePath) {
  return relativePath.startsWith('data/')
    || relativePath.includes('/data/')
    || DATA_EXTENSIONS.has(path.extname(relativePath).toLowerCase());
}

function digest(source) {
  return createHash('sha256').update(source).digest('hex');
}

export function inspectPublicText(relativePath, source) {
  const findings = [];
  if (/\bsourceMappingURL\s*=/.test(source)) {
    findings.push(finding('critical', 'source_map_reference', relativePath, 'A public asset references a source map.'));
  }
  for (const rule of SECRET_PATTERNS) {
    if (rule.pattern.test(source)) {
      findings.push(finding('critical', rule.code, relativePath, 'A high-confidence secret signature was found. Rotate it before any release.'));
    }
  }
  return findings;
}

function inspectResearchBoundary(relativePath, source = '') {
  const findings = [];
  if (relativePath === 'research-lab/data/agents.json.gz') {
    findings.push(finding(
      'critical',
      'full_research_population_public',
      relativePath,
      'The complete 5,000-agent research corpus is browser-downloadable. Keep it server-side and publish only a reviewed projection.'
    ));
  }
  if (/^research-lab\/assets\/[A-Za-z0-9_-]+\.js$/.test(relativePath)) {
    const policy = REVIEWED_RESEARCH_SCRIPTS[relativePath];
    if (!policy) {
      findings.push(finding(
        'critical',
        'unreviewed_research_script',
        relativePath,
        'A new Research browser script is not in the reviewed script manifest.'
      ));
    } else {
      const actualDigest = digest(source);
      if (actualDigest !== policy.sha256) {
        findings.push(finding(
          'critical',
          'research_script_digest_drift',
          relativePath,
          `The reviewed ${policy.classification} changed bytes and requires a new security review.`
        ));
      }
      if (policy.blockedCode) {
        findings.push(finding('critical', policy.blockedCode, relativePath, policy.blockedMessage));
      }
    }
  }
  return findings;
}

export async function auditPublicArtifact(root) {
  const absoluteRoot = path.resolve(root);
  const rootInfo = await stat(absoluteRoot);
  if (!rootInfo.isDirectory()) throw new Error(`Public artifact is not a directory: ${absoluteRoot}`);

  const files = await listFiles(absoluteRoot);
  const findings = [];
  for (const relativePath of files) {
    const absolutePath = path.join(absoluteRoot, relativePath);
    const entryInfo = await lstat(absolutePath);
    if (entryInfo.isSymbolicLink()) {
      findings.push(finding('critical', 'public_symlink', relativePath, 'Symbolic links are not allowed in a public artifact. Copy and review the intended file explicitly.'));
      continue;
    }
    let fileBuffer;
    const readBuffer = async () => {
      if (!fileBuffer) fileBuffer = await readFile(absolutePath);
      return fileBuffer;
    };
    for (const rule of FORBIDDEN_PATHS) {
      if (rule.pattern.test(relativePath)) findings.push(finding('critical', rule.code, relativePath, rule.message));
    }

    const info = entryInfo;
    if (isDataPath(relativePath)) {
      const policy = REVIEWED_PUBLIC_DATA[relativePath];
      if (!policy && relativePath !== 'research-lab/data/agents.json.gz') {
        findings.push(finding('critical', 'unreviewed_public_data', relativePath, 'This browser-readable dataset is not in the reviewed public-data manifest.'));
      }
      if (policy && info.size > policy.maxBytes) {
        findings.push(finding('critical', 'public_data_size_drift', relativePath, `The reviewed ${policy.classification} exceeded its ${policy.maxBytes}-byte release limit.`));
      }
      if (policy && digest(await readBuffer()) !== policy.sha256) {
        findings.push(finding('critical', 'public_data_digest_drift', relativePath, `The reviewed ${policy.classification} changed bytes and requires a new data review.`));
      }
    }

    const extension = path.extname(relativePath).toLowerCase();
    let source = '';
    if (TEXT_EXTENSIONS.has(extension)) {
      if (info.size > MAX_TEXT_INSPECTION_BYTES) {
        findings.push(finding(
          'critical',
          'public_text_size_ceiling',
          relativePath,
          `Browser-readable text exceeds the ${MAX_TEXT_INSPECTION_BYTES}-byte inspection ceiling and cannot be released unscanned.`
        ));
      } else {
        source = (await readBuffer()).toString('utf8');
        findings.push(...inspectPublicText(relativePath, source));
      }
    }
    findings.push(...inspectResearchBoundary(relativePath, source));
  }

  return {
    root: absoluteRoot,
    files,
    findings,
    criticalCount: findings.filter((item) => item.severity === 'critical').length
  };
}

export function formatAudit(result) {
  const lines = [
    `Public artifact: ${result.root}`,
    `Files inspected: ${result.files.length}`,
    `Critical findings: ${result.criticalCount}`
  ];
  for (const item of result.findings) {
    lines.push(`[${item.severity.toUpperCase()}] ${item.code} — ${item.file}: ${item.message}`);
  }
  if (!result.findings.length) lines.push('No public-exposure violations found.');
  return lines.join('\n');
}

if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT_PATH) {
  const target = process.argv[2];
  if (!target) throw new Error('Usage: node scripts/audit-public-artifact.mjs <public-artifact-directory>');
  const result = await auditPublicArtifact(target);
  console.log(formatAudit(result));
  if (result.criticalCount) process.exitCode = 1;
}
