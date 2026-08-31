# Backer public release boundary

Backer treats every file and response delivered to a browser as public. View Source, DevTools, downloaded assets, DOM state, and browser-readable API payloads cannot be made confidential. Disabling right-click, hiding URLs, gzip, minification, WebAssembly, and obfuscation are not access controls.

## Required boundary

- Public: rendered interface assets, deliberately public market observations, and the minimum public view models needed by the interface.
- Server-only: credentials, signing keys, write-capable provider access, private account state, authorization decisions, raw or private datasets, unpublished research, internal prompts, proprietary scoring/forecast logic, and administrator operations.
- Authenticated API responses must apply object-level authorization and return only the fields needed for that request.
- Production browser artifacts must not contain source maps, environment files, internal documents, tests, migrations, source ledgers, backups, or secret signatures.

The source repository must be private when source confidentiality matters. A public repository exposes every committed file and its history even when a deployment artifact omits those files. Public hosting should receive an allowlisted build artifact from the private source repository.

## Release gate

Every Backer page, including Research Lab and future routes, must pass the public-artifact gate before deployment:

```bash
pnpm install --frozen-lockfile
release_dir="$(mktemp -d)"
node scripts/build-pages-artifact.mjs "$release_dir"
```

The build is fail-closed. It minifies browser JavaScript/CSS without source maps, copies only explicitly reviewed files, scans allowlisted source before minification and emitted output afterward, rejects oversized text and symbolic links, and rejects known client-side proprietary research computation. Reviewed datasets and Research chunks are byte-pinned; update their digests only after reviewing the changed public fields and behavior. A failed build removes its staging artifact.

The bytes that pass this gate must be the bytes that are deployed. Configure GitHub Pages to deploy only an artifact uploaded by a protected workflow, require the release check and deployment environment, and prevent direct publication to `gh-pages`. Repository code alone cannot stop an owner from bypassing CI with a manual branch deployment.

The current Research Lab architecture remains a blocker because it downloads the complete 5,000-agent corpus and executes the simulation/forecast engine in the browser. Resolve that by moving the corpus and authoritative experiment computation to authenticated server-side storage/functions, then return only a reviewed public projection.

## Reporting

Do not open a public issue containing credentials, private datasets, or exploitable account details. Send a private report to the repository owner and include the affected route, impact, and a minimal reproduction without sensitive values.
