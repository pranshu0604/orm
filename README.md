# P.R.A.N. — Public Reputation and Analysis Node

A dashboard that tracks an X (Twitter) account's public stats, scores its performance, and drafts content suggestions. The interface is a terminal-style HUD.

**Live:** https://orm-pran.vercel.app · **Public demo (read-only):** https://orm-pran.vercel.app/demo

The AI work lives in a separate FastAPI service, [pran-ai](https://github.com/pranshu0604/pran-ai) (the "P.R.A.N. AI Service").

## Screenshots

<!-- screenshots -->

## What it does

- **Scheduled scraping.** Public profile and post stats are collected by a GitHub Actions cron (`scripts/scrape-twitter-data.ts`, Playwright against Nitter instances) and stored in Postgres.
- **Streamed AI reports.** Engagement metrics are computed in code by the AI service; an LLM writes only the qualitative assessment. The report streams to the browser over SSE as it is generated.
- **Suggestions with context.** Post ideas, bio rewrites, accounts to follow and reply drafts, using your previous reports as context.
- **Public demo.** `/demo` shows the owner's latest stored report and suggestions read-only. If none are stored, or the database is unreachable, it shows a clearly labelled sample instead.
- **AI warm-up.** The AI service runs on a free tier that sleeps. `/api/ai/warm` pings its health endpoint (at most once a minute) and the UI shows whether it is asleep, waking or ready.

X only. There is no GitHub integration and no real-time monitoring: data is as fresh as the last scheduled scrape.

## Architecture

```
Browser ── Next.js 15 (App Router, Vercel) ── Postgres (Neon, Prisma 7)
               │  Clerk auth                └─ Upstash Redis (throttles, optional)
               └── bearer-token HTTP + SSE ── pran-ai (FastAPI, Groq gpt-oss-20b)

GitHub Actions cron ── Playwright scraper ── Postgres
```

- `app/` routes: `/` dashboard, `/demo`, `/onboarding`, `/settings/connections`, API routes under `app/api/`.
- `app/api/*/stream` routes call the AI service and translate its SSE events into `saved` / `error` events after persisting the result.
- Report and suggestion `content` is stored as a JSON string.
- Production fails closed: with no `AI_SERVICE_URL`, AI routes return an error instead of falling back to localhost.

## Run locally

Requires Node 22 and a Postgres database.

```bash
npm ci
cp .env.example .env        # fill in the values
npx prisma migrate deploy   # or `prisma migrate dev` on a scratch database
npm run dev
```

The AI service is optional for browsing; start [pran-ai](https://github.com/pranshu0604/pran-ai) on port 8000 to generate reports locally.

### Environment

See `.env.example`. Required to boot: `DATABASE_URL`, `DIRECT_DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`. For AI features: `AI_SERVICE_URL`, `AI_SERVICE_TOKEN`. `DEMO_OWNER_CLERK_USER_ID` selects whose data `/demo` shows; leave empty for sample data.

### Checks

```bash
npm run lint
npm run typecheck
npm test        # node:test via tsx
npm run build
```

CI (`.github/workflows/ci.yml`) runs the same steps on Node 22 with dummy environment values.

## Stack

Next.js 15, React 19, TypeScript, Tailwind, Clerk, Prisma 7 (pg adapter), Postgres, Upstash Redis, Playwright, GitHub Actions.

## License

MIT, see [LICENSE](LICENSE).
