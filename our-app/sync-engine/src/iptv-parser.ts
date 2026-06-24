import * as fs from 'node:fs'
import * as path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const playlistParser = require('iptv-playlist-parser')

import type { ChannelData, FeedData, LogoData, StreamRecord } from './types.js'

export interface ParserConfig {
  streamsDir: string
  dataDir: string
}

export function loadJsonData<T>(filePath: string): T[] {
  const fullPath = path.resolve(filePath)
  const raw = fs.readFileSync(fullPath, 'utf-8')
  return JSON.parse(raw) as T[]
}

export function parseAllM3uFiles(config: ParserConfig): StreamRecord[] {
  const streamsDir = path.resolve(config.streamsDir)
  if (!fs.existsSync(streamsDir)) {
    console.error(`Streams directory not found: ${streamsDir}`)
    return []
  }

  const files = fs.readdirSync(streamsDir).filter(f => f.endsWith('.m3u'))
  const allStreams: StreamRecord[] = []

  for (const file of files) {
    const filePath = path.join(streamsDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')

    try {
      const parsed = playlistParser.parse(content)
      for (const item of parsed.items) {
        const [channelId, feedId] = (item.tvg?.id || '').split('@')
        const { title, label, quality } = parseName(item.name || item.tvg?.id || '')

        allStreams.push({
          channel_id: channelId || null,
          feed_id: feedId || null,
          title: title || item.name || '',
          url: item.url || '',
          quality: quality || null,
          label: label || null,
          user_agent: item.http?.['user-agent'] || null,
          referrer: item.http?.referrer || null
        })
      }
    } catch (err) {
      console.warn(`Failed to parse ${file}:`, err)
    }
  }

  return allStreams
}

function parseName(name: string): { title: string; label: string; quality: string } {
  let title = name
  const labelMatch = title.match(/ \[(.*?)\]$/)
  const label = labelMatch ? labelMatch[1] : ''
  if (labelMatch) title = title.slice(0, labelMatch.index)

  const qualityMatch = title.match(/ \(([0-9]+[pPiI])\)$/)
  const quality = qualityMatch ? qualityMatch[1] : ''
  if (qualityMatch) title = title.slice(0, qualityMatch.index)

  return { title: title.trim(), label, quality }
}

export function getChannelLogo(channelId: string, logos: LogoData[]): string | null {
  const channelLogos = logos.filter(l => l.channel === channelId)
  if (channelLogos.length === 0) return null

  const pngLogos = channelLogos.filter(l => l.format === 'PNG').sort((a, b) => a.width - b.width)
  if (pngLogos.length > 0) return pngLogos[0].url

  const anyLogos = channelLogos.sort((a, b) => {
    const fmtOrder: Record<string, number> = { SVG: 0, PNG: 1, WebP: 2, JPEG: 3 }
    return (fmtOrder[a.format] ?? 99) - (fmtOrder[b.format] ?? 99)
  })
  return anyLogos[0]?.url || null
}
