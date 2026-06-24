export interface ChannelData {
  id: string
  name: string
  alt_names?: string[]
  network: string | null
  owners?: string[]
  country: string
  categories: string[]
  is_nsfw: boolean
  website?: string
  launched?: string
  closed?: string
  replaced_by?: string
}

export interface FeedData {
  channel: string
  id: string
  name: string
  alt_names?: string[]
  is_main: boolean
  broadcast_area: string[]
  languages: string[]
  timezones: string[]
  video_format: string
}

export interface LogoData {
  channel: string
  feed: string | null
  tags: string[]
  width: number
  height: number
  format: string
  url: string
}

export interface StreamRecord {
  channel_id: string | null
  feed_id: string | null
  title: string
  url: string
  quality: string | null
  label: string | null
  user_agent: string | null
  referrer: string | null
}

export interface ParsedStream {
  channel: string | null
  feed: string | null
  title: string
  url: string
  quality: string | null
  label: string | null
  user_agent: string | null
  referrer: string | null
}

export interface SyncResult {
  channels_upserted: number
  streams_upserted: number
  feeds_upserted: number
  categories_upserted: number
  countries_upserted: number
  total_streams: number
  total_channels: number
  orphaned_channels_deleted: number
  data_source: string
}
