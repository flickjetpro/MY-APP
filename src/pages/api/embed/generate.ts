import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase, sendJSON, sendError } from '../../../lib/api/supabase'
import { generateShortCode } from '../../../lib/api/short-code'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    const { data: channel } = await getSupabase()
      .from('channels')
      .select('id')
      .eq('id', channel_id)
      .single()

    if (!channel) {
      return sendError(res, 'Channel not found', 404)
    }

    let shortCode = generateShortCode()
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await getSupabase()
        .from('embeds')
        .select('short_code')
        .eq('short_code', shortCode)
        .single()

      if (!existing) break
      shortCode = generateShortCode()
      attempts++
    }

    const expiresAt = expires_in_days
      ? new Date(Date.now() + expires_in_days * 86400000).toISOString()
      : null

    const { error } = await getSupabase()
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
