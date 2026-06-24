import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase, sendJSON, sendError } from '../lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return sendJSON(res, {})
  }

  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405)
  }

  try {
    const { code } = req.query

    if (!code || String(code).length !== 6) {
      return sendError(res, 'Invalid embed code', 400)
    }

    // Lookup embed
    const { data: embed, error: embedError } = await supabase
      .from('embeds')
      .select('*')
      .eq('short_code', String(code))
      .single()

    if (embedError || !embed) {
      return sendError(res, 'Embed not found', 404)
    }

    // Check expiry
    if (embed.expires_at && new Date(embed.expires_at) < new Date()) {
      return sendError(res, 'Embed has expired', 410)
    }

    // Get channel info
    const { data: channel } = await supabase
      .from('channels')
      .select('id, name, country_code, categories, logo_url')
      .eq('id', embed.channel_id)
      .single()

    if (!channel) {
      return sendError(res, 'Channel not found', 404)
    }

    // Get stream URL
    let streamQuery = supabase
      .from('streams')
      .select('id, title, url, quality, user_agent, referrer')
      .eq('channel_id', embed.channel_id)
      .eq('is_active', true)

    if (embed.stream_id) {
      streamQuery = streamQuery.eq('id', embed.stream_id)
    }

    const { data: streams } = await streamQuery
      .order('quality', { ascending: false, nullsFirst: false })
      .limit(1)

    const stream = streams?.[0] || null

    // Increment view count
    await supabase
      .from('embeds')
      .update({ views: (embed.views || 0) + 1 })
      .eq('short_code', String(code))

    return sendJSON(res, {
      channel: {
        id: channel.id,
        name: channel.name,
        country: channel.country_code,
        categories: channel.categories,
        logo: channel.logo_url
      },
      stream: stream ? {
        id: stream.id,
        title: stream.title,
        url: stream.url,
        quality: stream.quality,
        user_agent: stream.user_agent,
        referrer: stream.referrer
      } : null,
      embed: {
        code: embed.short_code,
        created_at: embed.created_at
      }
    })
  } catch (err: any) {
    return sendError(res, err.message, 500)
  }
}
