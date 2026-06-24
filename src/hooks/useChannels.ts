import { useState, useEffect, useCallback } from 'react'
import { getChannels, getChannel, getStreams } from '@/lib/api-client'
import type { Channel, ChannelDetail, Stream, PaginatedResponse } from '@/lib/api-client'

export function useChannels(filters?: {
  country?: string
  category?: string
  search?: string
  page?: number
  limit?: number
}) {
  const [data, setData] = useState<PaginatedResponse<Channel> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getChannels(filters)
      setData(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(filters)])

  useEffect(() => {
    fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}

export function useChannel(id: string) {
  const [data, setData] = useState<ChannelDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getChannel(id)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  return { data, loading, error }
}
