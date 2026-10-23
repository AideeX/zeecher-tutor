# Working in this repository

Use this existing checkout; cloud tasks are isolated. Do not create a worktree unless explicitly requested.

Read README.md, IMPLEMENTATION_STATUS.md and the three supplied CODEX documents in docs/ before changing behaviour. The app was created from an otherwise empty repository; no prior 432-topic inventory was supplied.

Use Node 24+, npm ci, npm run setup and npm run dev. For npm cache permission errors, use --cache /workspace/.npm-cache. Runtime data and private PDFs are ignored; never commit them, real credentials or child records. Never print credential values or setup codes in logs.

Keep the external child-to-AI endpoint blocked. A flag or an API key alone cannot establish under-13 approval or zero data retention. Do not send child answers, writing or history to external services.

The small original teaching map is provisional. Private compilations are not official NERDC curricula. Unreviewed extraction candidates must not become child content. Preserve grade/term/week and source-page provenance; quarantine branded variants. Distinguish assistance, repeated practice, provisional mastery and spaced retention.

Before reporting success run npm run typecheck, npm run lint, npm test, npm run test:curriculum (if private PDFs are available), npm run test:e2e and npm run build. Update IMPLEMENTATION_STATUS.md with actual results and remaining gaps. Do not publish, push or deploy unless requested.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
