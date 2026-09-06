# Contributing to RepoLens

Thanks for considering a contribution! This is a small open-source project —
contributions of any size are welcome.

## Local setup

Follow the [README's "Getting started"](./README.md#getting-started) section
to clone, install, and configure environment variables. Redis/Vector/Gemini
are optional for working on browsing and analysis features; you'll need all
of them to test indexing or chat.

## Before opening a PR

```bash
npm run lint
npm run build
```

Both should pass cleanly. If you're changing UI, please check it in a real
browser (including a quick mobile-width check and dark mode) — type checking
alone doesn't catch layout or visual regressions.

## Code style

- Follow the existing patterns in the file/directory you're touching rather
  than introducing a new one — e.g. new GitHub API calls go through
  `src/lib/github.ts`'s `cached()` wrapper, new indexing logic goes under
  `src/lib/indexing/`.
- Keep components small and prefer reusing what's already in
  `src/components/ui/` (shadcn) before adding new UI primitives.
- No new dependencies for something a few lines of code can do.

## Reporting bugs / requesting features

Open a GitHub issue with:
- What you expected vs. what happened.
- A repo URL that reproduces it, if relevant (this app has no auth, so
  reproduction is usually just "paste this URL").
- Any console/server errors you saw.

## Pull requests

- Keep PRs focused — one fix or feature per PR is easier to review.
- Describe *why* the change is needed, not just what changed.
- Small, incremental PRs are preferred over large rewrites.
