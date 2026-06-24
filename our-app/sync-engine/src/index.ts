import {
  loadJsonData,
  loadJsonDataFromCacheOrLocal,
  downloadApiData,
  fetchStreamsFromApi,
  parseAllM3uFiles,
  getChannelLogo
} from './iptv-parser.js'

import {
  upsertChannels,
  upsertStreams,
  upsertFeeds,
  upsertCategories,
  upsertCountries,
  upsertLanguages,
  clearStreams,
  deleteOrphanedChannels
} from './supabase-client.js'

import type {
  ChannelData,
  FeedData,
  LogoData,
  StreamRecord,
  SyncResult
} from './types.js'

import { existsSync } from 'node:fs'

const DATA_DIR = process.env.DATA_DIR || './data'
const IPTV_MASTER_PATH = process.env.IPTV_MASTER_PATH || ''

async function main() {
  console.log('=== TV App Sync Engine ===')
  console.log(`Data directory: ${DATA_DIR}`)
  console.log('')

  // 1. Download fresh channel metadata from API (best-effort, falls back to local copies)
  console.log('Downloading fresh channel metadata...')
  await downloadApiData(DATA_DIR)

  // 2. Load channel metadata from cache (if API download succeeded) or local files
  console.log('')
  console.log('Loading channel metadata...')
  const channels = loadJsonDataFromCacheOrLocal<ChannelData>('channels.json', DATA_DIR)
  const feeds = loadJsonDataFromCacheOrLocal<FeedData>('feeds.json', DATA_DIR)
  const categories = loadJsonDataFromCacheOrLocal<{ id: string; name: string }>('categories.json', DATA_DIR)
  const countries = loadJsonDataFromCacheOrLocal<{ code: string; name: string; flag?: string; lang?: string }>('countries.json', DATA_DIR)
  const languages = loadJsonDataFromCacheOrLocal<{ code: string; name: string }>('languages.json', DATA_DIR)
  const logos = loadJsonDataFromCacheOrLocal<LogoData>('logos.json', DATA_DIR)

  console.log(`  Channels: ${channels.length}`)
  console.log(`  Feeds: ${feeds.length}`)
  console.log(`  Categories: ${categories.length}`)
  console.log(`  Countries: ${countries.length}`)
  console.log(`  Languages: ${languages.length}`)
  console.log(`  Logos: ${logos.length}`)
  console.log('')

  // 3. Enrich channels with logo URLs and normalize country codes
  console.log('Enriching channel data...')
  const countryMap: Record<string, string> = { UK: 'GB' }
  const enrichedChannels = channels.map(ch => ({
    ...ch,
    country: countryMap[ch.country] || ch.country,
    logo_url: getChannelLogo(ch.id, logos)
  }))

  // 4. Fetch stream URLs from both M3U files and API streams.json
  console.log('Fetching stream URLs...')
  const allStreams: StreamRecord[] = []
  const sources: string[] = []

  // Source 1: M3U files from iptv-org/iptv repo
  const streamsDir = IPTV_MASTER_PATH ? `${IPTV_MASTER_PATH}/streams` : '../../iptv-master/streams'
  if (existsSync(streamsDir)) {
    const m3u = parseAllM3uFiles({ streamsDir, dataDir: DATA_DIR })
    allStreams.push(...m3u)
    sources.push(`m3u(${m3u.length})`)
    console.log(`  Parsed ${m3u.length} streams from M3U files`)
  } else {
    console.warn(`  M3U streams directory not found: ${streamsDir}`)
  }

  // Source 2: IPTV API streams.json (catches streams missing tvg-id in M3U)
  try {
    const api = await fetchStreamsFromApi()
    allStreams.push(...api)
    sources.push(`api(${api.length})`)
    console.log(`  Fetched ${api.length} streams from API`)
  } catch (apiErr) {
    console.warn(`  API stream fetch failed: ${apiErr}`)
  }

  // Deduplicate by URL: prefer entry with channel_id populated
  const urlMap = new Map<string, StreamRecord>()
  for (const s of allStreams) {
    const existing = urlMap.get(s.url)
    if (!existing || (s.channel_id && !existing.channel_id)) {
      urlMap.set(s.url, s)
    }
  }
  const streams = [...urlMap.values()]
  const deduped = allStreams.length - streams.length
  let dataSource = sources.join('+') || 'none'

  console.log(`  Combined: ${streams.length} unique streams (${deduped} duplicates removed)`)
  console.log(`  Sources: [${sources.join(', ')}]`)

  // 5. Upload to Supabase
  console.log('')
  console.log('Uploading to Supabase...')

  if (process.argv.includes('--test')) {
    console.log('TEST MODE: No data will be written')
    console.log(`  Would upsert ${enrichedChannels.length} channels`)
    console.log(`  Would upsert ${feeds.length} feeds`)
    console.log(`  Would upsert ${streams.length} streams`)
    console.log(`  Would upsert ${categories.length} categories`)
    console.log(`  Would upsert ${countries.length} countries`)
    const result: SyncResult = {
      channels_upserted: enrichedChannels.length,
      streams_upserted: streams.length,
      feeds_upserted: feeds.length,
      categories_upserted: categories.length,
      countries_upserted: countries.length,
      total_streams: streams.length,
      total_channels: enrichedChannels.length,
      orphaned_channels_deleted: 0,
      data_source: dataSource
    }
    console.log('')
    console.log('=== Sync Result (TEST) ===')
    console.log(JSON.stringify(result, null, 2))
    return
  }

  const result: SyncResult = {
    channels_upserted: 0,
    streams_upserted: 0,
    feeds_upserted: 0,
    categories_upserted: 0,
    countries_upserted: 0,
    total_streams: streams.length,
    total_channels: enrichedChannels.length,
    orphaned_channels_deleted: 0,
    data_source: dataSource
  }

  const startTime = Date.now()

  // Upsert categories
  result.categories_upserted = await upsertCategories(categories)
  console.log(`  Categories upserted: ${result.categories_upserted}`)

  // Upsert countries
  const formattedCountries = countries.map(c => ({
    code: c.code,
    name: c.name,
    flag: c.flag,
    languages: c.lang ? [c.lang] : []
  }))
  result.countries_upserted = await upsertCountries(formattedCountries)
  console.log(`  Countries upserted: ${result.countries_upserted}`)

  // Upsert languages
  result.countries_upserted += await upsertLanguages(languages)
  console.log(`  Languages upserted: ${languages.length}`)

  // Upsert channels
  result.channels_upserted = await upsertChannels(enrichedChannels)
  console.log(`  Channels upserted: ${result.channels_upserted}`)

  // Upsert feeds
  result.feeds_upserted = await upsertFeeds(feeds)
  console.log(`  Feeds upserted: ${result.feeds_upserted}`)

  // Clear old streams then upsert fresh ones
  if (streams.length > 0) {
    console.log('  Clearing old streams...')
    await clearStreams()
    result.streams_upserted = await upsertStreams(streams)
    console.log(`  Streams upserted: ${result.streams_upserted}`)
  } else {
    console.log('  No streams to upsert, skipping stream update')
  }

  // Cleanup: delete channels that have no streams
  console.log('  Checking for orphaned channels...')
  result.orphaned_channels_deleted = await deleteOrphanedChannels()
  console.log(`  Orphaned channels deleted: ${result.orphaned_channels_deleted}`)

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log('')
  console.log(`=== Sync Complete in ${elapsed}s ===`)
  console.log(JSON.stringify(result, null, 2))
}

main().catch(err => {
  console.error('Sync failed:', err)
  process.exit(1)
})
