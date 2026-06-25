import type { HlsConfig } from 'hls.js'

export function createHlsConfig(userAgent?: string | null, referrer?: string | null): Partial<HlsConfig> {
  return {
    enableWorker: true,
    lowLatencyMode: false,
    backBufferLength: 30,
    maxBufferLength: 30,
    maxMaxBufferLength: 60,
    startLevel: 1,
    capLevelToPlayerSize: true,
    debug: false,
    fetchSetup: (context, initParams) => {
      const headers = new Headers(initParams.headers)
      if (userAgent) headers.set('User-Agent', userAgent)
      if (referrer) headers.set('Referer', referrer)
      return { ...initParams, headers }
    }
  }
}
