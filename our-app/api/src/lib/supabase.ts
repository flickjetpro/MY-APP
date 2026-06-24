import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('SUPABASE_URL and SUPABASE_ANON_KEY environment variables not set')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function sendJSON(res: any, data: any, status = 200) {
  res.status(status).json(data)
}

export function sendError(res: any, message: string, status = 400) {
  res.status(status).json({ error: message })
}

export function getPagination(query: any) {
  const page = Math.max(1, parseInt(query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20))
  const offset = (page - 1) * limit
  return { page, limit, offset }
}
