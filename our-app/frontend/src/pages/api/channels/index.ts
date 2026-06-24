import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase, sendJSON, sendError, getPagination } from '../../../lib/api/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    return sendJSON(res, {})
  }

  if (req.method !== 'GET') {
    return sendError(res, 'Method not allowed', 405)
  }

  try {
    const { page, limit, offset } = getPagination(req.query)
    const { country, category, search } = req.query

    let query = supabase
      .from('channels')
      .select('*', { count: 'exact' })

    if (country) {
      query = query.eq('country_code', String(country).toUpperCase())
    }

    if (category) {
      query = query.contains('categories', [String(category)])
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error, count } = await query
      .order('name')
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
