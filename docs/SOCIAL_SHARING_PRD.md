# Backer social link previews

## Problem and outcome

Backer links currently lack a complete image-card declaration. Sharing a public
Backer page on X should give the crawler a large branded banner, the page title
and a useful description directly in the HTML response. The same behavior must
cover the Vercel and GitHub Pages deployments, including nested Research pages
and existing redirect aliases.

## Scope

- Add a public 1200 × 630 PNG banner and `summary_large_image` Twitter Card tags,
  plus equivalent Open Graph metadata, to every allowlisted public HTML page.
- Generate metadata during the existing audited build so newly allowlisted pages
  inherit the behavior. Preserve the authored title and description; aliases use
  the destination page's copy. Fail the build when a public page lacks that copy.
- Use absolute HTTPS image and page URLs for the selected deployment. The default
  base is `https://backer-site.vercel.app/`; GitHub builds explicitly select
  `https://bokubokulee-gif.github.io/backer-site/`.
- Leave protected analytics pages without social cards. Keep their noindex
  behavior, and allow crawlers to retrieve the public HTML and image.
- Keep site visuals, navigation, translations and interactions unchanged.

## Static language behavior

The existing `?lang=en`, `?lang=zh`, `?lang=ja` and `?lang=ko` variants translate
in the browser. Social crawlers receive the same static English title and
description for these query variants and the same universal Backer banner.
Localized crawler metadata would require separate static language routes or
server rendering and is outside this change.

## Acceptance and release

Build and audit both deployment bases. Inspect the emitted HTML for every public
page: exactly one card declaration, complete image metadata, no duplicate social
tags, meaningful destination copy on aliases, and no cards on admin pages.
Confirm that the banner is a valid 1200 × 630 PNG and publicly retrievable with
the correct image content type. Reopen the changed public routes on both hosts,
including nested Research and all four language query variants, after release.
X controls fetching, caching and card display; existing posts may retain an older
cached preview until X refreshes it.

## Build commands

```sh
node scripts/build-pages-artifact.mjs /tmp/backer-vercel-public
node scripts/build-pages-artifact.mjs /tmp/backer-github-public --site-url https://bokubokulee-gif.github.io/backer-site/
```

`PUBLIC_SITE_URL` is also supported; an explicit `--site-url` takes precedence.
The output directory must be empty, as required by the existing release builder.
