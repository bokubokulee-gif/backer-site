# Backer waitlist storage

Status: endpoint code is prepared. A database and Vercel deployment must be configured and verified before the public form can collect registrations.

The GitHub Pages site can stay at its current address. Its form sends JSON to a Vercel function at `https://YOUR-VERCEL-HOST/api/waitlist`, which writes to a private PostgreSQL database. GitHub stores the source code; registration emails belong in the database, never in commits, issues or public artifacts. Hosting the frontend on Vercel also works, using `/api/waitlist` on the same origin.

## Configure

1. Use the existing Vercel project and server-side PostgreSQL database if available. The repository already includes `pg`, `api/_lib/db.js`, and the public-artifact build in `vercel.json`. No frontend framework migration is needed.
2. Run `migrations/006_waitlist.sql` intentionally against the selected database. It is standalone and does not require analytics migrations. Use the table-owner database role for the server connection; browser roles have no table privileges or RLS policies.
3. Set these server-side Vercel environment variables and redeploy:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Private PostgreSQL connection string; use the provider's serverless pooler |
   | `DATABASE_SSL` | `require` for the production database |
   | `DATABASE_SSL_REJECT_UNAUTHORIZED` | `true` |
   | `WAITLIST_RATE_LIMIT_SECRET` | Independent random secret, at least 32 bytes; generate privately with `openssl rand -base64 48` |
   | `WAITLIST_ALLOWED_ORIGINS` | Exact comma-separated origins; default `https://bokubokulee-gif.github.io` |

   Include the final Vercel frontend origin if that frontend submits the form. Origins have scheme and host, with no path or trailing slash. Do not use wildcards. Local testing can explicitly allow `http://127.0.0.1:4222`; remove development origins from production.
4. Set the public `backer-waitlist-endpoint` meta value in `waitlist.html` to the verified endpoint URL. This URL is public; credentials must never appear in it. For a frontend on a different host, that frontend's Content Security Policy must permit the exact API origin in `connect-src`. The existing Vercel CSP already permits a same-origin API.
5. Deploy the audited public artifact to GitHub Pages and deploy the server function through Vercel. Copying `api/waitlist.js` to GitHub Pages cannot execute it; the Pages allowlist must continue excluding backend source and migrations.

## API contract and behavior

`POST /api/waitlist`, `Content-Type: application/json`, at most 1,024 bytes:

```json
{"email":"person@example.com","source":"backer-waitlist","submittedAt":"2026-09-14T04:15:00.000Z"}
```

Only `email` is required. If included, `source` must be `backer-waitlist` and `submittedAt` must parse as a timestamp. The database assigns the actual creation time. Unknown fields are rejected. Addresses are trimmed and lowercased; duplicate addresses leave the original record intact.

- `200 {"ok":true}` means the database accepted the registration, including an existing address. No account, verified email identity, trading access or confirmation email is created by this endpoint.
- `400` / `413` / `415`: invalid input, excessive body size or unsupported content type.
- `403`: origin not allowed.
- `429`: ten attempts per IP per clock hour have been consumed; `Retry-After` gives seconds until the next hour. Attempts, including duplicate requests, use a durable database counter across function instances.
- `503`: the database, schema, trusted IP header or secret is unavailable. The form must retain the email for retry and show an error, never a success state or a local-only substitute.

Only the normalized email, fixed source and server creation time are stored as signup data. Rate buckets contain an HMAC of the trusted IP, never a raw IP. Vercel requests use the existing trusted `x-vercel-forwarded-for` helper; an arbitrary `x-forwarded-for` is not trusted. Origin restrictions are browser protections, not authentication or a complete anti-bot system.

## Verify and operate

Run `node --test tests/backend-waitlist.test.js` locally. These are mocked database tests; they do not establish a live connection or validate the SQL against a running database.

After configuration, use an owner-controlled test address to verify a signup from the canonical site and inspect one row in the database's private dashboard. Repeat the same address and confirm one row remains. Verify a disallowed origin, a simulated service failure, and the rate limit in a separate preview environment. Do not test rate limits against real visitors or submit another person's address.

The owner can view/export `email`, `source`, and `created_at` from `backer_waitlist` using the database provider's authenticated dashboard. There is no public list/export endpoint. Handle CSV exports privately; delete an address on request from that table.

Expired abuse-control buckets are removed after successful requests. Also schedule the following SQL daily through the database provider so buckets expire during periods with no signups:

```sql
delete from backer_waitlist_rate_limits where expires_at < now();
```

Each bucket expires within two hours of its clock-hour start. Daily cleanup may add up to 24 hours. The signup records remain until the owner removes them; select and communicate a retention policy before collecting real registrations.
