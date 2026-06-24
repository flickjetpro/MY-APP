import type { Config } from 'hls.js'

export function createHlsConfig(userAgent?: string | null, referrer?: string | null): Partial<Config> {
  return {
    enableWorker: true,
    lowLatencyMode: false,
    backbufferLength: 30,
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
