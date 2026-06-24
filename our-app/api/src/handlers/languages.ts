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
    const { data, error } = await supabase
      .from('languages')
      .select('code, name')
      .order('name')

    if (error) {
      return sendError(res, error.message, 500)
    }

    return sendJSON(res, { data: data || [] })
  } catch (err: any) {
    return sendError(res, err.message, 500)
  }
}
