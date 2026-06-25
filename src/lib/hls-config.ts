import type { HlsConfig } from 'hls.js'

export function createHlsConfig(): Partial<HlsConfig> {
  return {
    enableWorker: true,
    lowLatencyMode: false,
    backBufferLength: 30,
    maxBufferLength: 30,
    maxMaxBufferLength: 60,
    startLevel: 1,
    capLevelToPlayerSize: true,
    debug: false
  }
}
