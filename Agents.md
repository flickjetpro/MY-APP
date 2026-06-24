IPTV org github link is "https://github.com/iptv-org/iptv"
IPTV org github repository downloaded location "H:\TV APP\iptv-master"

# DOX framework

- DOX is highly performant AGENTS.md hierarchy installed here
- Agent must follow DOX instructions across any edits

## Core Contract

- AGENTS.md files are binding work contracts for their subtrees
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it

## Read Before Editing

1. Read the root AGENTS.md
2. Identify every file or folder you expect to touch
3. Walk from the repository root to each target path
4. Read every AGENTS.md found along each route
5. If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there
6. Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules
7. If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX

Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

## Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child DOX Index
- Child AGENTS.md files own domain-specific instructions and their own Child DOX Index
- Each parent explains what its direct children cover and what stays owned by the parent
- The closer a doc is to the work, the more specific and practical it must be

## Child Doc Shape

- Create a child AGENTS.md when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards
- Work Guidance must reflect the current standards of the project or user instructions; if there are no specific standards or instructions yet, leave it empty
- Verification must reflect an existing check; if no verification framework exists yet, leave it empty and update it when one exists

Default section order:
- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

## Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local version
- Delete stale notes instead of explaining history
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist

## Closeout

1. Re-check changed paths against the DOX chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child DOX Index
4. Remove stale or contradictory text
5. Run existing verification when relevant
6. Report any docs intentionally left unchanged and why

## User Preferences

When the user requests a durable behavior change, record it here or in the relevant child AGENTS.md

## Child DOX Index

### `our-app/` — TV Application (Data pipeline only)
- **Purpose**: Database schema, sync engine, data files, and configs.
- **Ownership**: This subtree.

| Path | Scope |
|------|-------|
| `our-app/supabase-schema.sql` | Database schema for Supabase (channels, streams, feeds, categories, countries, languages, ads, embeds) |
| `our-app/sync-engine/` | Data pipeline: parses IPTV API + local M3U files into Supabase via upsert |
| `our-app/sync-engine/src/index.ts` | Main sync entry: fetch API → transform → upsert to Supabase |
| `our-app/sync-engine/src/iptv-parser.ts` | IPTV API fetcher + M3U file parser + channel metadata loader |
| `our-app/sync-engine/src/supabase-client.ts` | Supabase upsert functions for all tables, orphan cleanup |
| `our-app/sync-engine/src/types.ts` | TypeScript interfaces for all data types |
| `our-app/sync-engine/data/` | Local copies of channel metadata (channels.json, categories.json, countries.json, feeds.json, languages.json, logos.json, regions.json) |
| `our-app/.env.example` | Environment variable template |

### Root — Next.js TV App (Vercel entry point)
- **Purpose**: Frontend web app + API serverless endpoints, deployed on Vercel.
- **Ownership**: Repo root.

| Path | Scope |
|------|-------|
| `package.json` | Next.js app entry point (Vercel auto-detects) |
| `vercel.json` | Vercel config (Next.js framework, build command) |
| `next.config.js` | Next.js config (React strict mode, remote images) |
| `src/pages/index.tsx` | Home — channel grid with filters |
| `src/pages/watch/[id].tsx` | Watch page with MediaPlayer |
| `src/pages/embed/[code].tsx` | Minimal embed page for iframe |
| `src/pages/category/[slug].tsx` | Channels filtered by category |
| `src/pages/country/[code].tsx` | Channels filtered by country |
| `src/pages/api/channels/index.ts` | GET /api/channels — list channels with filters |
| `src/pages/api/channels/[id].ts` | GET /api/channels/:id — channel detail with streams |
| `src/pages/api/streams/index.ts` | GET /api/streams — list streams with filters |
| `src/pages/api/categories/index.ts` | GET /api/categories |
| `src/pages/api/countries/index.ts` | GET /api/countries |
| `src/pages/api/languages/index.ts` | GET /api/languages |
| `src/pages/api/embed/[code].ts` | GET /api/embed/:code — resolve short code to stream |
| `src/pages/api/embed/generate.ts` | POST /api/embed/generate — create short embed link |
| `src/pages/api/sync/trigger.ts` | POST /api/sync/trigger — manual sync trigger (delegates to GitHub Actions) |
| `src/components/media/MediaPlayer.tsx` | Core player: HLS.js + Ad flow + controls |
| `src/components/media/AdOverlay.tsx` | Pre-roll ad with 5s countdown + skip button |
| `src/components/media/PlayerControls.tsx` | Play/pause, volume, fullscreen, quality selector |
| `src/components/media/StreamError.tsx` | Error state component |
| `src/components/embed/EmbedPlayer.tsx` | Lightweight embed player (no chrome) |
| `src/lib/api-client.ts` | Frontend API client functions |
| `src/lib/api/supabase.ts` | Supabase client helper (API routes) |
| `src/lib/api/short-code.ts` | Base62 short code generator |
| `src/lib/hls-config.ts` | HLS.js configuration presets |

### `iptv-master/` — IPTV Org Repository (Source Only)
- **Purpose**: Source of M3U streaming links and channel metadata. Periodically updated via git pull. Not modified by this project.
- **Ownership**: iptv-org (upstream). This project only reads from it.

| Path | Scope |
|------|-------|
| `iptv-master/streams/` | 323 M3U playlist files by country and source |
| `iptv-master/scripts/` | TypeScript parsing/generation scripts (reference for our sync engine) |
| `iptv-master/tests/__data__/input/data/` | Source of our local channel metadata copies |