import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import Hls from 'hls.js'
import { createHlsConfig } from '@/lib/hls-config'

interface EmbedPlayerProps {
  streamUrl: string
  referrer?: string | null
  user_agent?: string | null
  channelName?: string
  adUrl?: string
}

export default function EmbedPlayer({
  streamUrl,
  referrer,
  user_agent,
  channelName,
  adUrl = '/ads/sample-ad.mp4'
}: EmbedPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const adVideoRef = useRef<HTMLVideoElement>(null)

  const [showAd, setShowAd] = useState(true)
  const [canSkip, setCanSkip] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Build proxy URL
  const proxyUrl = useMemo(() => {
    const params = new URLSearchParams({ url: streamUrl })
    if (referrer) params.set('referrer', referrer)
    if (user_agent) params.set('ua', user_agent)
    return `/api/proxy?${params.toString()}`
  }, [streamUrl, referrer, user_agent])

  // Initialize stream after ad
  const initStream = useCallback(() => {
    setShowAd(false)
    const video = videoRef.current
    if (!video || !streamUrl) return

    const isHls = streamUrl.includes('.m3u8') && Hls.isSupported()
    if (isHls) {
      const hls = new Hls(createHlsConfig())
      hlsRef.current = hls
      hls.loadSource(proxyUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {})
      })
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setHasError(true)
      })
    } else {
      video.src = streamUrl
      video.play().catch(() => setMuted(true))
    }
  }, [proxyUrl, streamUrl])

  // Ad logic
  useEffect(() => {
    if (!showAd || !adVideoRef.current) return
    const ad = adVideoRef.current

    const onTime = () => {
      const elapsed = Math.floor(ad.currentTime)
      setTimeLeft(Math.max(0, 30 - elapsed))
      if (elapsed >= 5) setCanSkip(true)
    }

    const onEnd = () => initStream()
    const onErr = () => initStream()

    ad.addEventListener('timeupdate', onTime)
    ad.addEventListener('ended', onEnd)
    ad.addEventListener('error', onErr)
    ad.play().catch(() => {
      ad.muted = true
      ad.play().catch(initStream)
    })

    return () => {
      ad.removeEventListener('timeupdate', onTime)
      ad.removeEventListener('ended', onEnd)
      ad.removeEventListener('error', onErr)
    }
  }, [showAd, initStream])

  const skipAd = () => {
    if (!canSkip) return
    if (adVideoRef.current) {
      adVideoRef.current.pause()
      adVideoRef.current.src = ''
    }
    initStream()
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (playing) video.pause()
    else video.play().catch(() => {})
  }

  const toggleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen()
  }

  // Track play/pause on stream
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (hlsRef.current) hlsRef.current.destroy()
    }
  }, [])

  if (hasError) {
    return (
      <div style={{
        width: '100%', height: '100%', background: '#111',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#999', fontFamily: 'sans-serif', fontSize: '14px'
      }}>
        Stream unavailable
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{
      position: 'relative', width: '100%', height: '100%',
      background: '#000', overflow: 'hidden'
    }}>
      {/* Stream video */}
      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        playsInline
        muted={muted}
      />

      {/* Ad overlay */}
      {showAd && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <video
            ref={adVideoRef}
            src={adUrl}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            playsInline
          />
          <div style={{
            position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
            color: 'white', fontSize: '1.1rem', fontWeight: 600,
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}>
            Ad &middot; {timeLeft}s
          </div>
          <button
            onClick={skipAd}
            disabled={!canSkip}
            style={{
              position: 'absolute', bottom: 30, right: 24,
              padding: '8px 20px', background: canSkip ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              border: `1px solid ${canSkip ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)'}`,
              color: 'white', borderRadius: 4, cursor: canSkip ? 'pointer' : 'not-allowed',
              fontSize: '0.85rem', opacity: canSkip ? 1 : 0.4
            }}
          >
            {canSkip ? 'Skip Ad →' : `Skip in ${timeLeft}s`}
          </button>
        </div>
      )}

      {/* Minimal controls */}
      {!showAd && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5,
          padding: '8px 12px', background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          display: 'flex', alignItems: 'center', gap: 12, opacity: 0,
          transition: 'opacity 0.3s'
        }}
          className="embed-controls"
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
        >
          <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}>
            {playing ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
          {channelName && (
            <span style={{ color: 'white', fontSize: '0.8rem', opacity: 0.8 }}>{channelName}</span>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={toggleFullscreen} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Hover style for embed controls */}
      <style>{`
        .embed-controls { opacity: 0 !important; }
        *:hover > .embed-controls { opacity: 1 !important; }
      `}</style>
    </div>
  )
}
