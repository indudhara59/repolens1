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
| `UPSTASH_VECTOR_REST_URL` / `UPSTASH_VECTOR_REST_TOKEN` | [Upstash Console](https://console.upstash.com/vector) → Create Index (free tier) → REST API section. Used in a later stage to store code embeddings for RAG. |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) → Create API key (free tier). Used in a later stage for the chat + embeddings features. |

## Project status

This is stage 1 of a 5-stage build: project scaffolding, the GitHub data
layer, and a repo landing page. Analysis views and the RAG chat come in later
stages.

## Deploy on Vercel

Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new),
then add the environment variables above in the project settings.
