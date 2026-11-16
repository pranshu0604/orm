# P.R.A.N. portfolio preview

The public page links to /mvp, a dashboard with sample data. Only the configured personal Clerk user can connect a GitHub profile or run live reports. GitHub report generation uses public GitHub data and stores the report in Postgres. X collection requires Playwright Chromium and remains local-development only. Hosted X OAuth is disabled; the backend contracts for X reports and suggestions remain available to authenticated server callers.

## Personal Vercel Hobby preview

Use the Next.js preset, Node.js 22.x, install command `npm ci`, and build command `npm run build`. Use one stable HTTPS preview hostname for Clerk, `NEXTAUTH_URL`, and the OAuth callback. Enable Fluid Compute for the report routes' 120-second request budget. Keep the existing production branch and environment untouched until preview validation is complete.

| Preview variable | Value |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Matching keys from a personal Clerk instance configured for the preview hostname |
| `DEMO_OWNER_CLERK_USER_ID` | The personal owner's Clerk `user_…` ID from that instance |
| `DEMO_OWNER_GITHUB_LOGIN` | `pranshu0604` |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Personal GitHub OAuth App for the preview; authorization callback is `<preview-origin>/api/auth/callback/github` |
| `NEXTAUTH_URL` | The exact stable preview origin, e.g. `https://<stable-preview-host>` |
| `NEXTAUTH_SECRET` | Unique random value (`openssl rand -hex 32`) |
| `DATABASE_URL` | Personal Preview Postgres runtime URL (pooled if available) |
| `DIRECT_DATABASE_URL` | Direct URL for the same Preview database; needed where migrations run |
| `AI_SERVICE_URL` | The verified personal HTTPS Render service origin |
| `AI_SERVICE_TOKEN` | Same 32+ character random value as the Render service |
| `NEXT_PUBLIC_WAITLIST_ENABLED` | Leave unset or `false` for the portfolio preview |

Only the publishable Clerk key and optional waitlist flag go in the browser. Leave X, Upstash, and Clerk webhook settings unset for the preview. OAuth creates the owner's database row from their verified primary Clerk email if needed.

Run `npx prisma migrate deploy` once with the dedicated Preview database's direct URL before testing sign-in. The six checked-in migrations already include the GitHub and suggestion enum values; do not run `prisma db push` against an existing deployment. On an existing database, confirm migration status and drift separately before applying anything.

Check the Render health URL, then sign in as the owner on the stable preview hostname, connect the personal GitHub profile, and generate a report in Settings → Connections. Check that an unauthenticated visitor can view /mvp and a non-owner cannot generate a report. If the Free backend is asleep, request /v1/health and wait for its JSON response before running the report.
