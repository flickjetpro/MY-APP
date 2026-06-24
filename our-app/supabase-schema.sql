-- ============================================================
-- TV App - Supabase Database Schema
-- ============================================================

-- 1. CHANNELS
CREATE TABLE channels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  alt_names TEXT[] DEFAULT '{}',
  country_code TEXT,
  network TEXT,
  owners TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  logo_url TEXT,
  website TEXT,
  is_nsfw BOOLEAN DEFAULT false,
  launched DATE,
  closed DATE,
  replaced_by TEXT
);

-- 2. FEEDS
CREATE TABLE feeds (
  channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  name TEXT,
  alt_names TEXT[] DEFAULT '{}',
  is_main BOOLEAN DEFAULT false,
  broadcast_area TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  timezones TEXT[] DEFAULT '{}',
  video_format TEXT,
  PRIMARY KEY (channel_id, id)
);

-- 3. STREAMS
CREATE TABLE streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id TEXT REFERENCES channels(id) ON DELETE CASCADE,
  feed_id TEXT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  quality TEXT,
  label TEXT,
  user_agent TEXT,
  referrer TEXT,
  is_active BOOLEAN DEFAULT true,
  last_tested TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_streams_channel_id ON streams(channel_id);
CREATE INDEX idx_streams_is_active ON streams(is_active);
CREATE INDEX idx_streams_quality ON streams(quality);

-- 4. CATEGORIES
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

-- 5. COUNTRIES
CREATE TABLE countries (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  languages TEXT[] DEFAULT '{}',
  flag TEXT
);

-- 6. LANGUAGES
CREATE TABLE languages (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

-- 7. ADS
CREATE TABLE ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  video_url TEXT NOT NULL,
  duration_seconds INTEGER DEFAULT 30,
  min_play_seconds INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. EMBEDS
CREATE TABLE embeds (
  short_code TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES streams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  views INTEGER DEFAULT 0
);

CREATE INDEX idx_embeds_channel_id ON embeds(channel_id);

-- Seed default ad
INSERT INTO ads (title, video_url, duration_seconds, min_play_seconds)
VALUES ('Default Ad', '/ads/sample-ad.mp4', 30, 5);
