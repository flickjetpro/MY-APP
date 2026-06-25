import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabase, sendJSON, sendError, getPagination } from '../../../lib/api/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    return sendJSON(res, {})
  }

  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405)
  }

  try {
    const { page, limit, offset } = getPagination(req.query)
    const { channel_id, country, category, is_active, quality } = req.query

    let query = getSupabase()
      .from('streams')
      .select('*, channels!inner(name, country_code, categories, logo_url)', { count: 'exact' })

    if (channel_id) {
      query = query.eq('channel_id', String(channel_id))
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true')
    }

    if (quality) {
      query = query.eq('quality', String(quality))
    }

    if (country) {
      query = query.eq('channels.country_code', String(country).toUpperCase())
    }

    if (category) {
      query = query.contains('channels.categories', [String(category)])
    }

    const { data, error, count } = await query
      .order('title')
      .range(offset, offset + limit - 1)

    if (error) {
      return sendError(res, error.message, 500)
    }

    return sendJSON(res, {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (err: any) {
    return sendError(res, err.message, 500)
  }
}
