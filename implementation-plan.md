# Implementation Plan - TV App

## Overview
Build a multi-sports TV streaming application with custom media player, ad system, embed support, and an auto-syncing data pipeline from IPTV org.

## Prerequisites
- [ ] Node.js 18+ installed
- [ ] GitHub account
- [ ] Vercel account (hobby/free)
- [ ] Supabase account (free tier)
- [ ] cron-jobs.org account (free tier)
- [ ] Git installed and configured

---

## Phase 1: Foundation (Days 1-2)

### 1.1 Create Supabase Project
- [ ] Go to supabase.com → Create new project
- [ ] Note down: Project URL, anon key, service_role key
- [ ] Create a `.env.local` template file for these keys
- [ ] Run `supabase-schema.sql` in Supabase SQL editor

**Deliverable:** Database with all tables created (channels, streams, feeds, categories, countries, languages, ads, embeds)

### 1.2 Scaffold the Project Repository
- [ ] Create GitHub repo `tv-app`
- [ ] Initialize `our-app/` directory structure:
  ```
  our-app/
  ├── sync-engine/
  ├── api/
  ├── frontend/
  └── supabase-schema.sql
  ```
- [ ] Initialize git & push

**Deliverable:** Empty monorepo on GitHub with folder structure

### 1.3 Copy Channel Metadata from iptv-master
- [ ] Locate test data: `iptv-master/tests/__data__/input/data/`
- [ ] Copy these JSON files to `our-app/sync-engine/data/`:
  - `channels.json`
  - `categories.json`
  - `countries.json`
  - `feeds.json`
  - `languages.json`
  - `regions.json`
  - `logos.json`

**Deliverable:** Local copy of channel database (independence from upstream API)

### 1.4 Build Sync Engine
- [ ] Initialize `sync-engine/` with `package.json` (dependencies: `@supabase/supabase-js`, `iptv-playlist-parser`, `typescript`, `tsx`)
- [ ] Create `src/types.ts` — TypeScript interfaces matching database schema
- [ ] Create `src/supabase-client.ts` — Supabase client with upsert methods:
  - `upsertChannels(channels[])`
  - `upsertStreams(streams[])`
  - `upsertCategories(categories[])`
  - `upsertCountries(countries[])`
  - `upsertLanguages(languages[])`
- [ ] Create `src/iptv-parser.ts` — Reads M3U files from `../../iptv-master/streams/` using `iptv-playlist-parser`, cross-references with local JSON data
- [ ] Create `src/index.ts` — Main entry: parse M3U → transform → upsert to Supabase
- [ ] Add npm scripts: `sync`, `sync:test`
- [ ] Run initial sync to populate Supabase

**Deliverable:** Working sync script that populates Supabase with all channels & streams

### 1.5 Create Sync Vercel Function
- [ ] Add `vercel.json` to `sync-engine/`
- [ ] Create `api/trigger.ts` — Wraps sync logic as Vercel serverless function
- [ ] Add simple auth check (query param or header secret)
- [ ] Deploy to Vercel

**Deliverable:** `POST /api/sync/trigger` endpoint that runs sync on demand

### 1.6 Set Up cron-jobs.org
- [ ] Go to cron-jobs.org → Create new cron job
- [ ] URL: `https://your-app.vercel.app/api/sync/trigger?secret=YOUR_SECRET`
- [ ] Schedule: Every 6 hours (`0 */6 * * *`)
- [ ] Save and test

**Deliverable:** Auto-sync every 6 hours, data stays fresh

---

## Phase 2: API (Days 3-4)

### 2.1 Scaffold API Project
- [ ] Initialize `api/` with `package.json` (dependencies: `@supabase/supabase-js`, `itty-router` or raw `parse-url`)
- [ ] Use Vercel Functions format (`api/*.ts`)
- [ ] Create `src/lib/supabase.ts` — Supabase client singleton

### 2.2 Build Channel Endpoints
- [ ] `api/channels.ts` — `GET /api/channels`
  - Query params: `country`, `category`, `search`, `page`, `limit`
  - Returns: paginated channel list
- [ ] `api/channels/[id].ts` — `GET /api/channels/:id`
  - Returns: single channel with all feeds & streams

### 2.3 Build Stream Endpoints
- [ ] `api/streams.ts` — `GET /api/streams`
  - Query params: `channel_id`, `country`, `category`, `is_active`, `page`, `limit`
- [ ] `api/streams/[channelId]/[[feedId]].ts` — `GET /api/streams/:channelId/:feedId?`

### 2.4 Build Metadata Endpoints
- [ ] `api/categories.ts` — `GET /api/categories`
- [ ] `api/countries.ts` — `GET /api/countries`
- [ ] `api/languages.ts` — `GET /api/languages`

### 2.5 Build Embed Endpoints
- [ ] `api/embed/[code].ts` — `GET /api/embed/:code`
  - Looks up short code in `embeds` table
  - Returns: `{ channel, stream, url, userAgent, referrer }`
- [ ] `api/embed/generate.ts` — `POST /api/embed/generate`
  - Body: `{ channel_id, stream_id?, expires_in? }`
  - Generates 6-char base62 code, stores in `embeds` table
  - Returns: `{ short_code, embed_url }`

### 2.6 Add CORS & Error Handling
- [ ] Add CORS headers to all responses (`Access-Control-Allow-Origin: *`)
- [ ] Standard error format: `{ error: string, code: number }`
- [ ] 404 for not found, 400 for bad params, 500 for server errors

### 2.7 Deploy API
- [ ] Add `vercel.json` with route config
- [ ] Deploy to Vercel
- [ ] Test all endpoints with curl/Postman

**Deliverable:** Full REST API deployed and tested

---

## Phase 3: Frontend - Channel Browsing (Days 5-7)

### 3.1 Scaffold Next.js App
- [ ] `npx create-next-app@latest frontend/ --typescript --tailwind --app`
- [ ] Install: `hls.js`, `dashjs`, `daisyui` (Tailwind plugin)
- [ ] Install dev: `@types/hls.js`
- [ ] Configure `tailwind.config.js` with daisyUI
- [ ] Set up `src/lib/api-client.ts` — Fetch wrapper for our API
- [ ] Set up environment variables in `.env.local`

### 3.2 Build Layout Components
- [ ] `Header.tsx` — App logo, navigation (Categories, Countries, Search), theme toggle
- [ ] `Footer.tsx` — Copyright, links
- [ ] `Sidebar.tsx` — Channel list sidebar (for watch page)
- [ ] Implement responsive layout (mobile-first)

### 3.3 Build Filter Components
- [ ] `CategoryFilter.tsx` — Dropdown or horizontal chips, fetches from `/api/categories`
- [ ] `CountryFilter.tsx` — Dropdown with flag emoji, fetches from `/api/countries`
- [ ] `SearchBar.tsx` — Input with debounce (300ms), calls `/api/channels?search=`
- [ ] `FilterBar.tsx` — Combines all filters horizontally, sticky on scroll

### 3.4 Build Channel Display Components
- [ ] `ChannelCard.tsx` — Card with: logo, channel name, country flag, quality badge, category tags
- [ ] `ChannelGrid.tsx` — Responsive grid (2 cols mobile, 4 cols tablet, 6 cols desktop)
- [ ] `Loading.tsx` — Skeleton loader matching card shape
- [ ] `Pagination.tsx` — Page number navigation

### 3.5 Build Home Page
- [ ] `pages/index.tsx` or `app/page.tsx`
  - FilterBar at top
  - ChannelGrid in main area
  - Loading state during fetch
  - Empty state when no results
  - Error state with retry button

### 3.6 Build Category & Country Pages
- [ ] `pages/category/[slug].tsx` — Pre-filtered by category
- [ ] `pages/country/[code].tsx` — Pre-filtered by country

### 3.7 Deploy Frontend
- [ ] Deploy to Vercel (connects to API)
- [ ] Test all pages, filters, search

**Deliverable:** Channel browsing app with filters and search

---

## Phase 4: Media Player (Days 8-10)

### 4.1 Install Media Libraries
- [ ] Install: `hls.js`, `dashjs`
- [ ] Create `src/lib/hls-config.ts` — HLS.js configuration presets
  - `enableWorker: true`
  - `lowLatencyMode: false`
  - `maxBufferLength: 30`
  - Custom `xhrSetup` for user-agent & referrer headers

### 4.2 Build StreamVideo Component
- [ ] `MediaPlayer.tsx` — Core player orchestrator
  - States: `LOADING`, `PRE_ROLL`, `PLAYING`, `ERROR`, `BUFFERING`
  - Detects stream type: `.m3u8` → HLS.js, `.mpd` → dash.js
  - Controls visibility: hidden during PRE_ROLL, shown during PLAYING

### 4.3 Build HLS.js Integration
- [ ] Initialize HLS.js with custom config
- [ ] Attach to `<video>` element
- [ ] Handle: `hlsLoaded`, `manifestParsed`, `levelSwitched`, `error`, `bufferStalled`
- [ ] Quality level selector from manifest variants
- [ ] Error recovery: try next level, then fallback

### 4.4 Build AdOverlay Component
- [ ] `AdOverlay.tsx` — Full-screen overlay during pre-roll
  - HTML5 `<video>` element for ad playback
  - Semi-transparent dark overlay
  - Countdown text (large, centered)
  - "Skip Ad →" button (disabled initially, enables after 5s)
  - Timer logic:
    ```
    onAdStart → startTime = Date.now()
    onTimeUpdate → elapsed = currentTime
    if elapsed >= 5 → enable skip button
    display: "Ad · " + Math.ceil(duration - elapsed) + "s"
    ```
  - On skip → emit `onSkip` event, fade out, start stream
  - On ad end → auto-transition to stream

### 4.5 Build PlayerControls Component
- [ ] `PlayerControls.tsx`
  - Play/Pause toggle button
  - Volume slider (0-100%)
  - Mute toggle
  - Quality selector dropdown (from HLS levels)
  - Fullscreen toggle (uses Fullscreen API)
  - Progress/seek bar (optional, many streams are live)
  - Auto-hide on inactivity (3s timeout)

### 4.6 Build StreamError Component
- [ ] `StreamError.tsx`
  - Error message: "Stream unavailable"
  - Possible causes: Geo-blocked, Offline, Invalid URL
  - Retry button
  - "Browse other channels" link

### 4.7 Build Watch Page
- [ ] `pages/watch/[id].tsx`
  - Takes channel ID from URL params
  - Fetches channel + stream from API
  - Renders MediaPlayer (large, 16:9)
  - Sidebar with related channels (same category/country)
  - Channel info below player (name, country, category, quality)

### 4.8 Handle Special Stream Requirements
- [ ] Apply `user_agent` header to HLS.js XHR requests
- [ ] Apply `referrer` header to HLS.js XHR requests
- [ ] Test with geo-blocked streams (handle 403 gracefully)

**Deliverable:** Working media player with ad system and controls

---

## Phase 5: Embed System (Days 11-12)

### 5.1 Build EmbedPlayer Component
- [ ] `EmbedPlayer.tsx` — Minimal version of MediaPlayer
  - Same ad flow (PRE_ROLL → PLAYING)
  - No header, no sidebar, no chrome
  - Only: video area + minimal controls (play/pause, fullscreen, volume)
  - Fixed aspect ratio: 16:9
  - Responsive: 100% width, auto height

### 5.2 Build Embed Page
- [ ] `pages/embed/[code].tsx`
  - Minimal HTML shell (no nav, no footer)
  - Fetches `/api/embed/:code` on mount
  - Renders EmbedPlayer with stream data
  - SEO meta tags: title = channel name, robots = noindex
  - CSP headers to allow embedding

### 5.3 Add Embed Generation UI
- [ ] On watch page or admin page:
  - "Generate Embed" button
  - Modal showing: short code, iframe HTML snippet
  - Copy to clipboard button
  - Example: `<iframe src="https://tvapp.com/e/X7k3mF" width="640" height="360" frameborder="0" allowfullscreen></iframe>`

### 5.4 Test Embedding
- [ ] Create test HTML page with iframe
- [ ] Test cross-origin embedding
- [ ] Test mobile responsiveness
- [ ] Test multiple concurrent embeds

**Deliverable:** Fully functional embed system with short links

---

## Phase 6: Polish & Launch (Days 13-15)

### 6.1 Stream Health Checking
- [ ] Add HTTP HEAD/GET test to sync engine
- [ ] Check: 200 status, content-type contains `application/vnd.apple.mpegurl` or `video`
- [ ] Mark failed streams as `is_active = false`
- [ ] Add `last_tested` timestamp

### 6.2 Error Handling & Edge Cases
- [ ] Handle empty states (no channels, no streams)
- [ ] Handle network errors (API down, stream down)
- [ ] Handle invalid URLs in stream data
- [ ] Graceful degradation: if HLS fails → show error with alternatives

### 6.3 Performance Optimization
- [ ] Lazy load channel images (IntersectionObserver or Next.js Image)
- [ ] Debounce search input (300ms)
- [ ] Implement Supabase caching in API (stale-while-revalidate)
- [ ] Optimize HLS.js: `startLevel: 1`, `capLevelToPlayerSize: true`
- [ ] Bundle analysis: ensure hls.js + dash.js are code-split

### 6.4 SEO & Meta Tags
- [ ] Add proper `<title>` and `<meta>` tags for each page
- [ ] Open Graph tags for channel pages
- [ ] Generate sitemap.xml
- [ ] Add `robots.txt`

### 6.5 Testing
- [ ] Test with real streams from multiple countries
- [ ] Test ad flow: 5s countdown, skip button timing
- [ ] Test on mobile (iOS Safari, Android Chrome)
- [ ] Test on Smart TV browsers (WebOS, Tizen, Android TV)
- [ ] Test embed on different domains

### 6.6 Deploy Everything
- [ ] Final deploy: frontend + API to Vercel
- [ ] Confirm cron-jobs.org is hitting sync endpoint
- [ ] Verify database is populated
- [ ] Set up custom domain (optional)

**Deliverable:** Production-ready TV app deployed and running

---

## Post-Launch Improvements (Backlog)

- [ ] Add user authentication (Supabase Auth)
- [ ] Add "Favorites" feature (save channels per user)
- [ ] Add EPG/guide data (from iptv-org/epg)
- [ ] Add multi-language UI
- [ ] PWA support (offline, installable)
- [ ] Server-side ad injection in stream
- [ ] Analytics dashboard (channel popularity, stream health stats)
- [ ] Admin panel for managing ads and embeds
- [ ] Rate limiting on embed generation API
- [ ] Stream recording/clipping (advanced)

---

## Milestone Summary

| Phase | Deliverable | Estimated Time |
|-------|-------------|----------------|
| 1 | Database + Sync Pipeline + cron | 2 days |
| 2 | REST API (Channels, Streams, Embed) | 2 days |
| 3 | Frontend Channel Browsing | 3 days |
| 4 | Custom Media Player + Ad System | 3 days |
| 5 | Embed System | 2 days |
| 6 | Polish, Testing, Launch | 3 days |
| **Total** | **Complete TV App** | **~15 days** |
