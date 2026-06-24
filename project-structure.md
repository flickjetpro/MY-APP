# TV App - Project Structure

## Overview

A multi-sports streaming TV application that collects channel streaming links from the IPTV-org repository, stores them in Supabase, and serves them via a custom API. Features a custom media player with ad integration and an embed system with short links.

## Architecture Diagram

```
cron-jobs.org (every 6h)
       │
       ▼
Sync Engine ──► iptv-master/ (M3U files)
       │
       ▼
   Supabase DB
       │
       ▼
Vercel API ◄──── Next.js Frontend
       │              │
       │              ├── MediaPlayer (HLS.js + Ad)
       │              └── EmbedPlayer (iframe)
       │
   3rd-party Apps
```

---

## Directory Structure

```
H:\TV APP\
│
├── iptv-master\                          # IPTV org repo (SOURCE - periodically updated via git pull)
│   ├── streams\                          # 323 M3U playlist files (by country & source)
│   │   ├── us.m3u
│   │   ├── de.m3u
│   │   ├── uk.m3u
│   │   └── ...
│   ├── scripts\                          # TypeScript parsing/generation scripts (REUSED by sync engine)
│   │   ├── api.ts                        # Core API data loader
│   │   ├── constants.ts                  # Path constants
│   │   ├── core\
│   │   │   ├── playlistParser.ts         # M3U → Stream objects parser
│   │   │   ├── streamTester.ts           # Stream URL health checker
│   │   │   └── dataSet.ts
│   │   ├── models\
│   │   │   ├── stream.ts                 # Stream data model
│   │   │   └── playlist.ts               # Playlist collection model
│   │   └── commands\playlist\
│   │       └── export.ts                 # M3U → JSON export (our sync engine uses this logic)
│   └── package.json                      # Dependencies (@iptv-org/sdk, iptv-playlist-parser, etc.)
│
├── our-app\                              # ★ YOUR APPLICATION ★
│   │
│   ├── supabase-schema.sql               # PostgreSQL schema for Supabase
│   │
│   ├── sync-engine\                      # DATA PIPELINE - fetches IPTV data → Supabase
│   │   ├── src\
│   │   │   ├── index.ts                  # Entry point: parse M3U + channels.json → Supabase upsert
│   │   │   ├── iptv-parser.ts            # Reuses iptv-master/scripts for M3U parsing
│   │   │   ├── supabase-client.ts        # Supabase connection & upsert logic
│   │   │   ├── stream-tester.ts          # Optional: HTTP health-check on stream URLs
│   │   │   └── types.ts                  # Shared TypeScript interfaces
│   │   ├── data\                         # Our local copy of channel metadata (INDEPENDENCE!)
│   │   │   ├── channels.json             # Channel definitions (id, name, country, categories)
│   │   │   ├── categories.json           # Category list
│   │   │   ├── countries.json            # Country list (code, name, flag)
│   │   │   ├── feeds.json                # Feed metadata (broadcast area, language, format)
│   │   │   ├── languages.json            # Language codes
│   │   │   ├── logos.json                # Channel logo URLs
│   │   │   └── regions.json              # Region groupings
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vercel.json                   # Deployed as Vercel function for cron trigger
│   │
│   ├── api\                              # REST API (Vercel Serverless Functions)
│   │   ├── src\
│   │   │   ├── lib\
│   │   │   │   ├── supabase.ts           # Supabase client singleton
│   │   │   │   ├── cache.ts              # Optional: in-memory/edge cache helpers
│   │   │   │   └── short-code.ts         # Base62 short code generator/decoder
│   │   │   └── handlers\
│   │   │       ├── channels.ts           # GET /api/channels?country&category&search&page&limit
│   │   │       ├── channels-[id].ts      # GET /api/channels/:id
│   │   │       ├── streams.ts            # GET /api/streams?channel_id&country&category&is_active
│   │   │       ├── categories.ts         # GET /api/categories
│   │   │       ├── countries.ts          # GET /api/countries
│   │   │       ├── embed-[code].ts       # GET /api/embed/:code (returns channel + stream data)
│   │   │       └── embed-generate.ts     # POST /api/embed/generate (creates short code)
│   │   ├── package.json
│   │   ├── vercel.json                   # Route config, CORS headers
│   │   └── tsconfig.json
│   │
│   ├── frontend\                         # Next.js TV App (Vercel)
│   │   ├── src\
│   │   │   ├── components\
│   │   │   │   ├── media\
│   │   │   │   │   ├── MediaPlayer.tsx       # Core player: HLS.js + DASH.js + Ad flow
│   │   │   │   │   ├── AdOverlay.tsx         # Pre-roll ad: countdown, skip button
│   │   │   │   │   ├── PlayerControls.tsx    # Play/pause, volume, fullscreen, quality
│   │   │   │   │   └── StreamError.tsx       # Stream offline/unavailable state
│   │   │   │   ├── channels\
│   │   │   │   │   ├── ChannelGrid.tsx       # Responsive grid of channel cards
│   │   │   │   │   ├── ChannelCard.tsx       # Single channel: logo, name, quality badge
│   │   │   │   │   └── ChannelDetail.tsx     # Channel info + stream list sidebar
│   │   │   │   ├── filters\
│   │   │   │   │   ├── CategoryFilter.tsx    # Category dropdown/chips
│   │   │   │   │   ├── CountryFilter.tsx     # Country dropdown with flag
│   │   │   │   │   ├── SearchBar.tsx         # Search input with debounce
│   │   │   │   │   └── FilterBar.tsx         # Combined filter layout
│   │   │   │   ├── layout\
│   │   │   │   │   ├── Header.tsx            # Logo, navigation, theme toggle
│   │   │   │   │   ├── Footer.tsx
│   │   │   │   │   └── Sidebar.tsx           # Channel list sidebar
│   │   │   │   ├── embed\
│   │   │   │   │   └── EmbedPlayer.tsx       # Lightweight iframe embed player
│   │   │   │   └── ui\
│   │   │   │       ├── Loading.tsx
│   │   │   │       ├── ErrorBoundary.tsx
│   │   │   │       └── Pagination.tsx
│   │   │   ├── pages\
│   │   │   │   ├── _app.tsx
│   │   │   │   ├── index.tsx                 # Home: channel grid with filters
│   │   │   │   ├── watch\
│   │   │   │   │   └── [id].tsx              # Full watch page with MediaPlayer
│   │   │   │   ├── category\
│   │   │   │   │   └── [slug].tsx            # Channels filtered by category
│   │   │   │   ├── country\
│   │   │   │   │   └── [code].tsx            # Channels filtered by country
│   │   │   │   ├── embed\
│   │   │   │   │   └── [code].tsx            # Embed page (minimal, no chrome)
│   │   │   │   └── api\                      # Optional BFF endpoints
│   │   │   │       └── [...]
│   │   │   ├── hooks\
│   │   │   │   ├── useChannels.ts            # Fetch channels with filters
│   │   │   │   ├── useStream.ts              # Fetch single stream URL
│   │   │   │   ├── useCategories.ts
│   │   │   │   └── useCountries.ts
│   │   │   ├── lib\
│   │   │   │   ├── api-client.ts             # Axios/fetch wrapper for our API
│   │   │   │   ├── hls-config.ts             # HLS.js configuration presets
│   │   │   │   └── utils.ts                  # Formatters, validators
│   │   │   └── styles\
│   │   │       ├── globals.css
│   │   │       ├── player.css               # MediaPlayer specific styles
│   │   │       └── embed.css                # Embed player minimal styles
│   │   ├── public\
│   │   │   ├── favicon.ico
│   │   │   └── ads\                         # Sample/placeholder ad videos
│   │   ├── package.json                     # next, react, hls.js, daisyui/tailwind
│   │   ├── next.config.js
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── vercel.json
│   │
│   └── project-structure.md                 # This file
│
└── AGENTS.md
```

---

## Database Schema (Supabase)

### Table: `channels`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `TEXT PK` | Channel ID (e.g., `BBCNews.uk`) |
| `name` | `TEXT NOT NULL` | Channel display name |
| `alt_names` | `TEXT[]` | Alternative names |
| `country_code` | `TEXT` | ISO 3166-1 alpha-2 country code |
| `network` | `TEXT` | Network name |
| `owners` | `TEXT[]` | Channel owners |
| `categories` | `TEXT[]` | Category IDs (e.g., `{sports,news}`) |
| `logo_url` | `TEXT` | Best available logo URL |
| `website` | `TEXT` | Official website |
| `is_nsfw` | `BOOLEAN DEFAULT false` | Adult content flag |
| `launched` | `DATE` | Launch date |
| `closed` | `DATE` | Closure date |
| `replaced_by` | `TEXT` | Replacement channel ID |

### Table: `feeds`

| Column | Type | Description |
|--------|------|-------------|
| `channel_id` | `TEXT FK → channels.id` | Parent channel |
| `id` | `TEXT` | Feed ID (unique per channel) |
| `name` | `TEXT` | Feed name (e.g., "East", "HD") |
| `is_main` | `BOOLEAN` | Is this the main feed? |
| `broadcast_area` | `TEXT[]` | Area codes (c/XX, r/XX, s/XX) |
| `languages` | `TEXT[]` | ISO 639-3 language codes |
| `timezones` | `TEXT[]` | IANA timezone IDs |
| `video_format` | `TEXT` | e.g., "576i", "1080i" |
| `PRIMARY KEY` | `(channel_id, id)` | |

### Table: `streams`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `UUID PK DEFAULT gen_random_uuid()` | Auto-generated |
| `channel_id` | `TEXT FK → channels.id` | Channel reference |
| `feed_id` | `TEXT` | Feed reference |
| `title` | `TEXT NOT NULL` | Stream display title |
| `url` | `TEXT NOT NULL` | Stream URL (m3u8, mpd, etc.) |
| `quality` | `TEXT` | Max quality (e.g., "1080p") |
| `label` | `TEXT` | Special status ("Geo-blocked", "Not 24/7") |
| `user_agent` | `TEXT` | Required User-Agent header |
| `referrer` | `TEXT` | Required Referer header |
| `is_active` | `BOOLEAN DEFAULT true` | Currently working? |
| `last_tested` | `TIMESTAMPTZ` | Last health-check timestamp |
| `created_at` | `TIMESTAMPTZ DEFAULT now()` | |

### Table: `categories`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `TEXT PK` | Category ID (e.g., `sports`) |
| `name` | `TEXT NOT NULL` | Display name (e.g., "Sports") |
| `description` | `TEXT` | Short description |

### Table: `countries`

| Column | Type | Description |
|--------|------|-------------|
| `code` | `TEXT PK` | ISO 3166-1 alpha-2 code |
| `name` | `TEXT NOT NULL` | Country name |
| `languages` | `TEXT[]` | Official language codes |
| `flag` | `TEXT` | Flag emoji |

### Table: `languages`

| Column | Type | Description |
|--------|------|-------------|
| `code` | `TEXT PK` | ISO 639-3 code |
| `name` | `TEXT NOT NULL` | Language name |

### Table: `ads`

| Column | Type | Description |
|--------|------|-------------|
| `id` | `UUID PK DEFAULT gen_random_uuid()` | Auto-generated |
| `title` | `TEXT` | Ad title/description |
| `video_url` | `TEXT NOT NULL` | Ad video URL |
| `duration_seconds` | `INTEGER DEFAULT 30` | Full ad duration |
| `min_play_seconds` | `INTEGER DEFAULT 5` | Minimum seconds before skip |
| `is_active` | `BOOLEAN DEFAULT true` | Currently serving? |
| `created_at` | `TIMESTAMPTZ DEFAULT now()` | |

### Table: `embeds`

| Column | Type | Description |
|--------|------|-------------|
| `short_code` | `TEXT PK` | 6-char base62 short code |
| `channel_id` | `TEXT FK → channels.id` | Channel to embed |
| `stream_id` | `UUID FK → streams.id` | Specific stream (nullable) |
| `created_at` | `TIMESTAMPTZ DEFAULT now()` | |
| `expires_at` | `TIMESTAMPTZ` | Optional expiry (null = permanent) |
| `views` | `INTEGER DEFAULT 0` | View counter |

---

## API Endpoints

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|-------------|
| `GET` | `/api/channels` | List channels | `country`, `category`, `search`, `page`, `limit` |
| `GET` | `/api/channels/:id` | Single channel detail | — |
| `GET` | `/api/streams` | List streams | `channel_id`, `country`, `category`, `is_active`, `page`, `limit` |
| `GET` | `/api/streams/:channelId/:feedId?` | Specific stream | — |
| `GET` | `/api/categories` | All categories | — |
| `GET` | `/api/countries` | All countries | — |
| `GET` | `/api/languages` | All languages | — |
| `GET` | `/api/embed/:code` | Resolve short code | Returns `{channel, streamUrl, userAgent, referrer}` |
| `POST` | `/api/embed/generate` | Create short code | Body: `{channel_id, stream_id?, expires_in?}` |
| `POST` | `/api/sync/trigger` | Trigger data sync | Protected endpoint (cron-jobs.org calls this) |

### Response Format (all endpoints)

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1500,
    "totalPages": 75
  }
}
```

---

## Data Sync Pipeline (Independence Strategy)

### Flow

```
1. cron-jobs.org ──HTTP POST──► /api/sync/trigger (Vercel)
2. Sync script clones/pulls latest iptv-master
3. Reads streams/*.m3u files using iptv-playlist-parser
4. Reads data/channels.json, data/categories.json etc.
5. Cross-references: channel_id → channel metadata
6. Upserts into Supabase:
   - channels (INSERT ON CONFLICT UPDATE)
   - streams (INSERT ON CONFLICT channel_id+feed_id DO UPDATE)
   - categories, countries, languages
7. Optional: tests stream URLs with HTTP HEAD
8. Marks broken streams as is_active = false
9. Returns sync summary: { channels: 1500, streams: 35000, broken: 200 }
```

### Independence Guarantee

| Scenario | Behavior |
|----------|----------|
| IPTV org API is down | Sync fails, but **existing data in Supabase remains**. App continues working. |
| IPTV org repo deleted | We have the M3U files in `iptv-master/` and channel data in `our-app/sync-engine/data/`. App continues working. |
| IPTV org repo updated | Next sync pulls latest M3U files, re-parses, upserts changes. |
| Our app goes viral | Supabase scales, Vercel edge network handles traffic. |

---

## Media Player Architecture

### Component Tree

```
MediaPlayer
├── AdOverlay              (shown during pre-roll)
│   ├── AdVideo            (HTML5 <video> for ad)
│   ├── CountdownTimer     ("Skip in 4s...")
│   └── SkipButton         (enabled after 5s)
├── StreamVideo            (HLS.js or DASH.js instance)
│   ├── HlsInstance        (hls.js for .m3u8)
│   └── DashInstance       (dash.js for .mpd)
├── PlayerControls
│   ├── PlayPauseButton
│   ├── VolumeSlider
│   ├── QualitySelector    (if variant playlists)
│   ├── FullscreenButton
│   └── ProgressBar
└── StreamError            (shown on failure)
```

### Ad Flow

```
User clicks "Watch" on a channel
        │
        ▼
MediaPlayer renders in "PRE_ROLL" state
        │
        ▼
AdOverlay appears with ad video
        │
        ▼
Ad plays + countdown: "Ad · 5 ... 4 ... 3 ... 2 ... 1"
        │
        ├── After 5 seconds ──► "Skip Ad →" button appears
        │                            │
        │                    [SKIP CLICKED]    [AD ENDS]
        │                            │              │
        │                            ▼              ▼
        │                     ┌──► Stream starts ◄──┘
        │                     │
        └── Before 5 sec ─────┘  (no action, forced to watch)
        │
        ▼
Player enters "PLAYING" state
Controls become available
```

### Stream Protocol Support

| Protocol | Library | Notes |
|----------|---------|-------|
| `.m3u8` (HLS) | HLS.js | Primary format, ~95% of streams |
| `.mpd` (DASH) | dash.js | Some streams use this |
| HTTP direct | Native `<video>` | Fallback for non-HLS |

---

## Embed System

### Short Code Generation

```
Algorithm: base62 (a-z, A-Z, 0-9)
Length: 6 characters
Space: 62^6 = 56.8 billion unique codes
Generation: crypto.randomBytes → base62 encode → 6 chars
Collision check: SELECT EXISTS WHERE short_code = ?
```

### Embed Flow

```
1. User/Admin calls POST /api/embed/generate
   Body: { channel_id: "BBCNews.uk" }
   Response: { short_code: "X7k3mF", embed_url: "https://tvapp.com/e/X7k3mF" }

2. Website owner embeds:
   <iframe src="https://tvapp.com/e/X7k3mF" width="640" height="360" frameborder="0" allowfullscreen></iframe>

3. Viewer visits embed URL:
   - GET /api/embed/X7k3mF returns channel + stream data
   - EmbedPlayer renders minimal player (no header, no sidebar, just player + ad)
   - Same ad flow applies
```

---

## Technology Stack

| Component | Technology | Justification |
|-----------|------------|---------------|
| **Frontend** | Next.js 14+ (React) | SSR for SEO, static generation for embeds, API routes |
| **Backend API** | Vercel Serverless Functions | Same repo as frontend, edge network, free tier |
| **Database** | Supabase (PostgreSQL) | Free tier, real-time, REST API, auth if needed |
| **Media Playback** | HLS.js + dash.js | Industry standard, full control over UI |
| **Styling** | Tailwind CSS + daisyUI | Rapid UI development, dark mode, responsive |
| **Hosting** | Vercel | Free, GitHub integration, edge functions |
| **Cron/Scheduling** | cron-jobs.org | Free tier, HTTP POST to sync endpoint |
| **Data Parsing** | iptv-playlist-parser + @iptv-org/sdk | Reuses IPTV org's existing tooling |
| **Language** | TypeScript | Type safety across entire stack |

---

## Development Phases

### Phase 1: Foundation
- [ ] Set up Supabase project
- [ ] Run `supabase-schema.sql` to create all tables
- [ ] Build sync engine: parse `iptv-master/streams/*.m3u` → Supabase
- [ ] Copy channel metadata JSON files to `sync-engine/data/`
- [ ] Run initial sync to populate database
- [ ] Deploy sync endpoint to Vercel
- [ ] Set up cron-jobs.org to call sync every 6 hours

### Phase 2: API
- [ ] Build channels endpoints (list, detail, search)
- [ ] Build streams endpoints (list, filter)
- [ ] Build categories/countries endpoints
- [ ] Add CORS headers
- [ ] Deploy API to Vercel
- [ ] Test all endpoints

### Phase 3: Frontend
- [ ] Scaffold Next.js app with Tailwind + daisyUI
- [ ] Build channel grid with filters (category, country, search)
- [ ] Build channel detail/watch page
- [ ] Build MediaPlayer with HLS.js integration
- [ ] Build AdOverlay with 5s countdown + skip button
- [ ] Add responsive design for mobile/TV

### Phase 4: Embed System
- [ ] Build embed short code generator
- [ ] Build EmbedPlayer component (minimal, no chrome)
- [ ] Build embed page (`/embed/[code]`)
- [ ] Add iframe embedding support with proper CSP headers

### Phase 5: Polish & Launch
- [ ] Stream health-checking (auto-mark broken streams)
- [ ] Error states and loading skeletons
- [ ] Performance optimization (lazy load, image optimization)
- [ ] SEO meta tags for watch pages
- [ ] Analytics integration (optional)
- [ ] Deploy everything to Vercel

---

## Key Files & Their Purposes

| File | Purpose |
|------|---------|
| `our-app/supabase-schema.sql` | Complete database schema |
| `our-app/sync-engine/src/index.ts` | Main sync script: M3U → Supabase |
| `our-app/sync-engine/data/channels.json` | Our copy of channel metadata (independence) |
| `our-app/api/src/handlers/channels.ts` | GET /api/channels endpoint |
| `our-app/api/src/handlers/embed-[code].ts` | Resolve short code → stream URL |
| `our-app/frontend/src/components/media/MediaPlayer.tsx` | Core player with HLS.js + ad flow |
| `our-app/frontend/src/components/media/AdOverlay.tsx` | Pre-roll ad with countdown + skip |
| `our-app/frontend/src/pages/embed/[code].tsx` | Embed page (minimal iframe player) |
| `our-app/frontend/src/lib/api-client.ts` | Frontend API consumer |
