import { createClient } from '@supabase/supabase-js'
import type { ChannelData, FeedData, StreamRecord } from './types'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export async function upsertChannels(channels: ChannelData[]): Promise<number> {
  const batchSize = 500
  let total = 0
  for (let i = 0; i < channels.length; i += batchSize) {
    const batch = channels.slice(i, i + batchSize)
    const { error } = await supabase
      .from('channels')
      .upsert(
        batch.map(ch => ({
          id: ch.id,
          name: ch.name,
          alt_names: ch.alt_names || [],
          country_code: ch.country || null,
          network: ch.network,
          categories: ch.categories || [],
          is_nsfw: ch.is_nsfw || false,
          website: ch.website || null,
          launched: ch.launched || null,
          closed: ch.closed || null,
          replaced_by: ch.replaced_by || null
        })),
        { onConflict: 'id', ignoreDuplicates: false }
      )
    if (error) {
      console.error(`Error upserting channels batch ${i}:`, error)
    } else {
      total += batch.length
    }
  }
  return total
}

export async function upsertStreams(streams: StreamRecord[]): Promise<number> {
  const batchSize = 500
  let total = 0
  for (let i = 0; i < streams.length; i += batchSize) {
    const batch = streams.slice(i, i + batchSize)
    const { error } = await supabase
      .from('streams')
      .upsert(
        batch.map(s => ({
          channel_id: s.channel_id,
          feed_id: s.feed_id,
          title: s.title,
          url: s.url,
          quality: s.quality,
          label: s.label,
          user_agent: s.user_agent,
          referrer: s.referrer,
          is_active: true,
          last_tested: new Date().toISOString()
        })),
        { onConflict: undefined }
      )
    if (error) {
      console.error(`Error upserting streams batch ${i}:`, error)
    } else {
      total += batch.length
    }
  }
  return total
}

export async function upsertFeeds(feeds: FeedData[]): Promise<number> {
  const batchSize = 500
  let total = 0
  for (let i = 0; i < feeds.length; i += batchSize) {
    const batch = feeds.slice(i, i + batchSize)
    const { error } = await supabase
      .from('feeds')
      .upsert(
        batch.map(f => ({
          channel_id: f.channel,
          id: f.id,
          name: f.name,
          alt_names: f.alt_names || [],
          is_main: f.is_main,
          broadcast_area: f.broadcast_area || [],
          languages: f.languages || [],
          timezones: f.timezones || [],
          video_format: f.video_format
        })),
        { onConflict: 'channel_id,id', ignoreDuplicates: false }
      )
    if (error) {
      console.error(`Error upserting feeds batch ${i}:`, error)
    } else {
      total += batch.length
    }
  }
  return total
}

export async function upsertCategories(categories: { id: string; name: string }[]): Promise<number> {
  const { error } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'id', ignoreDuplicates: false })
  if (error) {
    console.error('Error upserting categories:', error)
    return 0
  }
  return categories.length
}

export async function upsertCountries(countries: { code: string; name: string; flag?: string; languages?: string[] }[]): Promise<number> {
  const { error } = await supabase
    .from('countries')
    .upsert(
      countries.map(c => ({
        code: c.code,
        name: c.name,
        flag: c.flag || null,
        languages: c.languages || []
      })),
      { onConflict: 'code', ignoreDuplicates: false }
    )
  if (error) {
    console.error('Error upserting countries:', error)
    return 0
  }
  return countries.length
}

export async function upsertLanguages(languages: { code: string; name: string }[]): Promise<number> {
  const { error } = await supabase
    .from('languages')
    .upsert(languages, { onConflict: 'code', ignoreDuplicates: false })
  if (error) {
    console.error('Error upserting languages:', error)
    return 0
  }
  return languages.length
}

export async function clearStreams(): Promise<void> {
  const { error } = await supabase.from('streams').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) {
    console.error('Error clearing streams:', error)
  }
}

export async function deleteOrphanedChannels(): Promise<number> {
  const { data: orphaned, error: selectError } = await supabase
    .from('channels')
    .select('id')
    .not('id', 'in', supabase.from('streams').select('channel_id').not('channel_id', 'is', null))

  if (selectError) {
    console.warn('Could not query orphaned channels:', selectError.message)
    return 0
  }

  if (!orphaned || orphaned.length === 0) {
    console.log('  No orphaned channels found')
    return 0
  }

  const ids = orphaned.map(c => c.id)
  const { error: deleteError } = await supabase
    .from('channels')
    .delete()
    .in('id', ids)

  if (deleteError) {
    console.warn('Error deleting orphaned channels:', deleteError.message)
    return 0
  }

  console.log(`  Deleted ${ids.length} orphaned channels`)
  return ids.length
}
