import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase, sendJSON, sendError } from '../../../lib/api/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    return sendJSON(res, {})
  }

  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405)
  }

  try {
    const { id } = req.query

    if (!id) {
      return sendError(res, 'Channel ID is required', 400)
    }

    const { data: channel, error: channelError } = await getSupabase()
      .from('channels')
      .select('*')
      .eq('id', id)
      .single()

    if (channelError || !channel) {
      return sendError(res, 'Channel not found', 404)
    }

    const { data: streams } = await getSupabase()
      .from('streams')
      .select('id, feed_id, title, url, quality, label, user_agent, referrer, is_active')
      .eq('channel_id', id)
      .order('quality', { ascending: false, nullsFirst: false })

    return sendJSON(res, {
      ...channel,
      streams: streams || []
    })
  } catch (err: any) {
    return sendError(res, err.message, 500)
  }
}
