import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url, referrer, ua } = req.query

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  const headers: Record<string, string> = {}
  if (typeof referrer === 'string' && referrer) headers['Referer'] = referrer
  if (typeof ua === 'string' && ua) headers['User-Agent'] = ua

  try {
    const upstream = await fetch(url, { headers })

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: `Upstream returned ${upstream.status}` })
    }

    const contentType = upstream.headers.get('content-type') || ''
    const isM3u = contentType.includes('mpegurl') || contentType.includes('m3u') || url.includes('.m3u8')

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')

    if (isM3u) {
      const body = await upstream.text()
      const baseUrl = url
      const ref = typeof referrer === 'string' ? referrer : ''
      const userAgent = typeof ua === 'string' ? ua : ''
      const rewritten = rewriteM3u8(body, baseUrl, ref, userAgent)
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
      return res.status(200).send(rewritten)
    }

    // Non-M3U8: pass through as-is
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    for (const [key, value] of upstream.headers.entries()) {
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'x-frame-options'].includes(key)) {
        res.setHeader(key, value)
      }
    }
    const buffer = Buffer.from(await upstream.arrayBuffer())
    res.status(upstream.status).end(buffer)
  } catch (err: any) {
    res.status(502).json({ error: err.message })
  }
}

function buildProxyUrl(targetUrl: string, baseUrl: string, referrer: string, ua: string): string {
  const absolute = resolveUrl(targetUrl, baseUrl)
  const params = new URLSearchParams({ url: absolute })
  if (referrer) params.set('referrer', referrer)
  if (ua) params.set('ua', ua)
  return `/api/proxy?${params.toString()}`
}

function resolveUrl(relative: string, baseUrl: string): string {
  const resolved = new URL(relative, baseUrl)
  const base = new URL(baseUrl)
  base.searchParams.forEach((v, k) => {
    if (!resolved.searchParams.has(k)) {
      resolved.searchParams.set(k, v)
    }
  })
  return resolved.toString()
}

function rewriteM3u8(content: string, baseUrl: string, referrer: string, ua: string): string {
  return content.split('\n').map(line => {
    const trimmed = line.trim()
    if (!trimmed) return line

    if (trimmed.startsWith('#')) {
      const rewritten = line.replace(/URI="([^"]+)"/g, (_m: string, uri: string) => {
        const absolute = resolveUrl(uri, baseUrl)
        if (uri.includes('.m3u8')) {
          return `URI="${buildProxyUrl(uri, baseUrl, referrer, ua)}"`
        }
        return `URI="${absolute}"`
      })
      return rewritten
    }

    const absolute = resolveUrl(trimmed, baseUrl)
    if (trimmed.includes('.m3u8')) {
      return buildProxyUrl(trimmed, baseUrl, referrer, ua)
    }
    return absolute
  }).join('\n')
}
