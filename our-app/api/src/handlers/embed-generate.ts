import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase, sendJSON, sendError } from '../lib/supabase.js'
import { generateShortCode } from '../lib/short-code.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return sendJSON(res, {})
  }

  if (req.method !== 'POST') {
    return sendError(res, 'Method not allowed', 405)
  }

  try {
    const { channel_id, stream_id, expires_in_days } = req.body || {}

    if (!channel_id) {
      return sendError(res, 'channel_id is required', 400)
    }

    // Verify channel exists
    const { data: channel } = await supabase
      .from('channels')
      .select('id')
      .eq('id', channel_id)
      .single()

    if (!channel) {
      return sendError(res, 'Channel not found', 404)
    }

    // Generate unique short code
    let shortCode = generateShortCode()
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('embeds')
        .select('short_code')
        .eq('short_code', shortCode)
        .single()

      if (!existing) break
      shortCode = generateShortCode()
      attempts++
    }

    // Calculate expiry
    const expiresAt = expires_in_days
      ? new Date(Date.now() + expires_in_days * 86400000).toISOString()
      : null

    // Store embed
    const { error } = await supabase
      .from('embeds')
      .insert({
        short_code: shortCode,
        channel_id,
        stream_id: stream_id || null,
        expires_at: expiresAt,
        views: 0
      })

    if (error) {
      return sendError(res, error.message, 500)
    }

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    return sendJSON(res, {
      short_code: shortCode,
      embed_url: `${baseUrl}/e/${shortCode}`,
      iframe: `<iframe src="${baseUrl}/e/${shortCode}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`,
      expires_at: expiresAt
    }, 201)
  } catch (err: any) {
    return sendError(res, err.message, 500)
  }
}
