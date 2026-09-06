# RepoLens 🔍

RepoLens is an open-source, no-login web app: paste any public GitHub repo
URL to browse its releases and commits, see a full analysis dashboard for
any version (contributors, languages, commit activity, PRs, issues), and ask
an LLM questions about the actual code at that specific commit using RAG.

No sign-in, no user accounts — repos are indexed once and the analysis is
shared by everyone who looks at that same repo and commit.

<!-- 
  TODO: add a screenshot or short GIF here showing the flow:
  paste a repo URL -> browse releases -> analysis dashboard -> chat panel
  e.g. ![RepoLens demo](./docs/demo.gif)
-->

## Features

- **Browse** — paste a GitHub URL or `owner/repo`, browse releases and
  commits with infinite scroll and branch switching.
- **Analyze** — pick any release or commit and get a full dashboard: commit
  overview, changed files, top contributors, language breakdown, weekly
  commit activity, and the PRs/issues that existed at that point in history.
- **Ask** — index the repo at that exact commit (chunked, embedded, stored in
  a per-commit vector namespace) and chat with it: answers are grounded in
  retrieved code chunks with cited file paths/line ranges linking straight
  to GitHub, not hallucinated.
- **Quick actions** — "Explain this file" next to any changed file jumps
  straight into a pre-filled chat question.
- Dark mode, rate-limited public API routes, and metadata/OG tags for
  sharing — built to actually run on Vercel's free tier.

## Stack

Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui · Octokit against
the GitHub REST API with a server-side token · Upstash Redis for caching,
indexing progress, and rate limiting · Upstash Vector for code embeddings ·
Google Gemini (`text-embedding-004` + `gemini-2.0-flash`) via the Vercel AI
SDK for embeddings and streamed chat answers.

## Architecture

```
GitHub REST API (Octokit)
  └─ src/lib/github.ts            repo/release/commit/PR/issue fetchers,
                                   each wrapped in a Redis cache (src/lib/redis.ts)

Analysis dashboard (src/app/repo/[owner]/[repo]/[...ref])
  └─ Server Components per section, streamed independently via <Suspense>,
     each catching its own errors instead of taking down the whole page

Indexing pipeline (src/lib/indexing/)
  filter.ts   -> allowlist source files, skip binaries/lockfiles/oversized files
  chunk.ts    -> 60-line windows, 10-line overlap
  embed.ts    -> Gemini text-embedding-004 (RETRIEVAL_DOCUMENT / RETRIEVAL_QUERY)
  vector.ts   -> Upstash Vector, namespaced per `owner/repo@sha`
  job.ts      -> batches of 15 files per request, Redis-tracked progress,
                 a short lock so concurrent visitors share one indexing run
     driven by a client poll loop (src/hooks/use-index-job.ts) until done —
     since a commit is immutable, once indexed it's cached "done" for everyone

Chat (src/app/api/chat, src/components/analysis/chat-*)
  embed the question -> query the commit's Vector namespace for top-8 chunks
  -> build a grounded prompt -> stream the Gemini answer via the Vercel AI
     SDK's streamText, with sources attached as a response header
```

Everything expensive (indexing, chat) is rate-limited per IP
(`src/lib/rate-limit.ts`, `@upstash/ratelimit`) since there's no login to
otherwise attribute usage to.

## Getting started

```bash
git clone https://github.com/<your-username>/repolens.git
cd repolens
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app works without
any env vars for basic browsing (GitHub's unauthenticated rate limit is just
low), but indexing and chat require Redis, Vector, and a Gemini key.

## Environment variables

All of these are free to obtain and are read only on the server — none are
exposed to the browser.

| Variable | Where to get it |
| --- | --- |
| `GITHUB_TOKEN` | [GitHub → Settings → Developer settings → Fine-grained tokens](https://github.com/settings/personal-access-tokens/new). No repository access is needed for public repos — this just raises your API rate limit from 60 to 5,000 requests/hour. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | [Upstash Console](https://console.upstash.com/redis) → Create Database (free tier) → REST API section. Used for GitHub response caching, indexing progress, and rate limiting. |
| `UPSTASH_VECTOR_REST_URL` / `UPSTASH_VECTOR_REST_TOKEN` | [Upstash Console](https://console.upstash.com/vector) → Create Index (free tier) → REST API section. **Create the index with 768 dimensions and cosine similarity** (that's `text-embedding-004`'s output size). |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) → Create API key (free tier). Used for embeddings and chat answer generation. |
| `NEXT_PUBLIC_SITE_URL` | Optional. Your deployed URL, used to resolve absolute Open Graph image links. Defaults to `http://localhost:3000`. |

## Deploying to Vercel

1. Push this repo to your own GitHub account.
2. Import it at [vercel.com/new](https://vercel.com/new) (Next.js is
   auto-detected, no build config needed).
3. Add the environment variables above in **Project Settings → Environment
   Variables**, including `NEXT_PUBLIC_SITE_URL` set to your Vercel domain.
4. Deploy. The indexing and chat API routes are configured with
   `maxDuration = 60` (seconds), well inside Vercel Hobby's function limits.

## Local development notes

- `npm run build` / `npm run lint` should stay clean — these are the checks
  worth running before opening a PR.
- Redis, Vector, and Gemini are all optional for local dev in the sense that
  the app degrades gracefully without them (caching becomes a no-op, rate
  limiting is disabled, indexing/chat return a clear "not configured" error)
  rather than crashing — useful for working on browsing/analysis features
  without setting up the full stack.

## License

MIT — see [LICENSE](./LICENSE).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
