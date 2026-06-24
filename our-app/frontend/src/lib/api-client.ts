const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface Channel {
  id: string
  name: string
  alt_names?: string[]
  country_code: string
  network: string | null
  owners?: string[]
  categories: string[]
  logo_url: string | null
  website: string | null
  is_nsfw: boolean
}

export interface ChannelDetail extends Channel {
  streams: Stream[]
}

export interface Stream {
  id: string
  channel_id: string
  feed_id: string | null
  title: string
  url: string
  quality: string | null
  label: string | null
  user_agent: string | null
  referrer: string | null
  is_active: boolean
  channels?: {
    name: string
    country_code: string
    categories: string[]
    logo_url: string | null
  }
}

export interface Category {
  id: string
  name: string
}

export interface Country {
  code: string
  name: string
  flag: string | null
}

export interface EmbedResponse {
  channel: {
    id: string
    name: string
    country: string
    categories: string[]
    logo: string | null
  }
  stream: {
    id: string
    title: string
    url: string
    quality: string | null
    user_agent: string | null
    referrer: string | null
  } | null
  embed: {
    code: string
    created_at: string
  }
}

async function fetchAPI<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }

  const res = await fetch(url.toString())
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export async function getChannels(params?: {
  country?: string
  category?: string
  search?: string
  page?: number
  limit?: number
}): Promise<PaginatedResponse<Channel>> {
  return fetchAPI('/channels', params as any)
}

export async function getChannel(id: string): Promise<ChannelDetail> {
  return fetchAPI(`/channels/${id}`)
}

export async function getStreams(params?: {
  channel_id?: string
  country?: string
  category?: string
  is_active?: boolean
  quality?: string
  page?: number
  limit?: number
}): Promise<PaginatedResponse<Stream>> {
  return fetchAPI('/streams', params as any)
}

export async function getCategories(): Promise<{ data: Category[] }> {
  return fetchAPI('/categories')
}

export async function getCountries(): Promise<{ data: Country[] }> {
  return fetchAPI('/countries')
}

export async function getEmbed(code: string): Promise<EmbedResponse> {
  return fetchAPI(`/embed/${code}`)
}

export async function generateEmbed(body: {
  channel_id: string
  stream_id?: string
  expires_in_days?: number
}): Promise<{
  short_code: string
  embed_url: string
  iframe: string
  expires_at: string | null
}> {
  const res = await fetch(`${API_BASE}/embed/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }
  return res.json()
}
