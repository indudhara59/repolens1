# RepoLens

RepoLens is an open-source, no-login web app: paste a GitHub repo URL to browse
its releases/commits, see analysis (commits, PRs, issues tied to a selected
version), and ask an LLM questions about the code at that specific commit
using RAG.

Stack: Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui, Octokit
against the GitHub API with a server-side token, Upstash Redis for caching,
Upstash Vector for embeddings, Google Gemini for chat + embeddings. Deployed
on Vercel's free tier.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

All of these are free to obtain and are read only on the server — none are
exposed to the browser.

| Variable | Where to get it |
| --- | --- |
| `GITHUB_TOKEN` | [GitHub → Settings → Developer settings → Fine-grained tokens](https://github.com/settings/personal-access-tokens/new). Create a token with **no repository access is needed for public repos**, but if prompted, grant "Public Repositories (read-only)". This just raises your GitHub API rate limit from 60 to 5,000 requests/hour. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | [Upstash Console](https://console.upstash.com/redis) → Create Database (free tier) → REST API section. Used to cache GitHub API responses. |
| `UPSTASH_VECTOR_REST_URL` / `UPSTASH_VECTOR_REST_TOKEN` | [Upstash Console](https://console.upstash.com/vector) → Create Index (free tier) → REST API section. **Create the index with 768 dimensions and cosine similarity** — that's the output size of Gemini's `text-embedding-004` model used for indexing code chunks. |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) → Create API key (free tier). Used for embeddings now, and chat answer generation in a later stage. |

## Project status

Stage 3 of a 5-stage build: project scaffolding, GitHub data layer, the
analysis dashboard, and now the repo indexing pipeline (Git tree → filtered
source files → chunked → embedded → Upstash Vector, namespaced per
`owner/repo@sha`) behind the "Ask about this code" panel. The panel indexes
a repo on demand with a live progress bar; actually answering questions over
the indexed code is a later stage.

## Deploy on Vercel

Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new),
then add the environment variables above in the project settings.
