import {
  loadJsonData,
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
  SyncResult
} from './types.js'

import { existsSync } from 'node:fs'

const DATA_DIR = process.env.DATA_DIR || './data'
const IPTV_MASTER_PATH = process.env.IPTV_MASTER_PATH || ''

async function main() {
  console.log('=== TV App Sync Engine ===')
  console.log(`Data directory: ${DATA_DIR}`)
  console.log('')

  // 1. Load local channel metadata
  console.log('Loading channel metadata...')
  const channels = loadJsonData<ChannelData>(`${DATA_DIR}/channels.json`)
  const feeds = loadJsonData<FeedData>(`${DATA_DIR}/feeds.json`)
  const categories = loadJsonData<{ id: string; name: string }>(`${DATA_DIR}/categories.json`)
  const countries = loadJsonData<{ code: string; name: string; flag?: string; lang?: string }>(`${DATA_DIR}/countries.json`)
  const languages = loadJsonData<{ code: string; name: string }>(`${DATA_DIR}/languages.json`)
  const logos = loadJsonData<LogoData>(`${DATA_DIR}/logos.json`)

  console.log(`  Channels: ${channels.length}`)
  console.log(`  Feeds: ${feeds.length}`)
  console.log(`  Categories: ${categories.length}`)
  console.log(`  Countries: ${countries.length}`)
  console.log(`  Languages: ${languages.length}`)
  console.log(`  Logos: ${logos.length}`)
  console.log('')

  // 2. Enrich channels with logo URLs
  console.log('Enriching channel data...')
  const enrichedChannels = channels.map(ch => ({
    ...ch,
    logo_url: getChannelLogo(ch.id, logos)
  }))

  // 3. Fetch stream URLs
  console.log('Fetching stream URLs...')
  let streams: Awaited<ReturnType<typeof fetchStreamsFromApi>> = []
  let dataSource = ''

  // Primary: fetch from IPTV org API
  try {
    streams = await fetchStreamsFromApi()
    dataSource = 'iptv-org-api'
    console.log(`  Got ${streams.length} streams from API`)
  } catch (apiErr) {
    console.warn(`  API fetch failed: ${apiErr}`)

    // Fallback: parse local M3U files
    const streamsDir = IPTV_MASTER_PATH ? `${IPTV_MASTER_PATH}/streams` : '../../iptv-master/streams'
    if (existsSync(streamsDir)) {
      console.log('  Falling back to local M3U parsing...')
      streams = parseAllM3uFiles({ streamsDir, dataDir: DATA_DIR })
      dataSource = 'local-m3u'
      console.log(`  Got ${streams.length} streams from local M3U files`)
    } else {
      console.warn('  No local M3U files found either. Skipping streams.')
      dataSource = 'none'
    }
  }

  // 4. Upload to Supabase
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
