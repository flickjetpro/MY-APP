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
    const { data, error } = await getSupabase()
      .from('countries')
      .select('code, name, flag')
      .order('name')

    if (error) {
      return sendError(res, error.message, 500)
    }

    return sendJSON(res, { data: data || [] })
  } catch (err: any) {
    return sendError(res, err.message, 500)
  }
}
