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
    xhrSetup: (xhr) => {
      if (userAgent) {
        xhr.setRequestHeader('User-Agent', userAgent)
      }
      if (referrer) {
        xhr.setRequestHeader('Referer', referrer)
      }
    }
  }
}
