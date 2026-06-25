import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import Hls from 'hls.js'
import { createHlsConfig } from '@/lib/hls-config'
import AdOverlay from './AdOverlay'
import PlayerControls from './PlayerControls'
import StreamError from './StreamError'

type PlayerState = 'LOADING' | 'PRE_ROLL' | 'PLAYING' | 'ERROR' | 'BUFFERING'

interface MediaPlayerProps {
  streamUrl: string
  streamTitle?: string
  referrer?: string | null
  user_agent?: string | null
  poster?: string | null
  adUrl?: string
  autoPlay?: boolean
}

export default function MediaPlayer({
  streamUrl,
  streamTitle,
  referrer,
  user_agent,
  poster,
  adUrl = '/ads/sample-ad.mp4',
  autoPlay = true
}: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const retryCountRef = useRef(0)

  const [playerState, setPlayerState] = useState<PlayerState>(autoPlay ? 'PRE_ROLL' : 'LOADING')
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [qualityLevels, setQualityLevels] = useState<{ height: number; name: string }[]>([])
  const [currentLevel, setCurrentLevel] = useState(-1)
  const [error, setError] = useState<string | null>(null)

  // Build proxy URL: fetches M3U8 server-side (bypasses CORS, sets Referer/UA)
  const proxyUrl = useMemo(() => {
    const ref = referrer || user_agent ? '' : ''
    const params = new URLSearchParams({ url: streamUrl })
    if (referrer) params.set('referrer', referrer)
    if (user_agent) params.set('ua', user_agent)
    return `/api/proxy?${params.toString()}`
  }, [streamUrl, referrer, user_agent])

  // Initialize HLS.js stream
  const initStream = useCallback(() => {
    const video = videoRef.current
    if (!video || !streamUrl) return

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    setError(null)
    setPlayerState(prev => prev !== 'PLAYING' ? 'LOADING' : prev)
    retryCountRef.current = 0

    const isHls = streamUrl.includes('.m3u8') ||
                  Hls.isSupported() && !streamUrl.includes('.mpd')

    if (isHls && Hls.isSupported()) {
      const hls = new Hls(createHlsConfig())
      hlsRef.current = hls

      // Use proxy URL to bypass CORS and set Referer/UA server-side
      hls.loadSource(proxyUrl)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = data.levels.map((l, i) => ({
          height: l.height,
          name: `${l.height}p`
        }))
        setQualityLevels(levels)
        setCurrentLevel(hls.currentLevel)

        if (playerState !== 'PRE_ROLL') {
          video.play().catch(() => {})
        }
      })

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        setCurrentLevel(data.level)
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              retryCountRef.current++
              if (retryCountRef.current <= 3) {
                hls.startLoad()
              } else {
                setError('Stream not responding — check if it is still online')
                setPlayerState('ERROR')
              }
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError()
              break
            default:
              setError('Stream failed to load')
              setPlayerState('ERROR')
              break
          }
        }
      })
    } else if (streamUrl.includes('.mpd')) {
      video.src = streamUrl
      if (playerState !== 'PRE_ROLL') {
        video.play().catch(() => {})
      }
    } else {
      video.src = streamUrl
      if (playerState !== 'PRE_ROLL') {
        video.play().catch(() => {})
      }
    }
  }, [proxyUrl, streamUrl, playerState])

  // Start stream after ad
  const startStream = useCallback(() => {
    setPlayerState('PLAYING')
    const video = videoRef.current
    if (video) {
      video.play().catch(() => setMuted(true))
    }
  }, [])

  // Initialize on mount
  useEffect(() => {
    if (playerState !== 'PRE_ROLL') {
      initStream()
    }
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [initStream, playerState])

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onWaiting = () => setPlayerState('BUFFERING')
    const onCanPlay = () => {
      if (playerState === 'PLAYING' && playing) setPlayerState('PLAYING')
    }
    const onError = () => {
      if (playerState !== 'PRE_ROLL') {
        setError('Video playback error')
        setPlayerState('ERROR')
      }
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('canplay', onCanPlay)
    video.addEventListener('error', onError)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('error', onError)
    }
  }, [playerState, playing])

  const handlePlayPause = () => {
    const video = videoRef.current
    if (!video) return
    if (playing) {
      video.pause()
    } else {
      video.play().catch(() => {})
    }
  }

  const handleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  const handleVolumeChange = (v: number) => {
    const video = videoRef.current
    if (!video) return
    video.volume = v
    setVolume(v)
    if (v > 0 && muted) {
      video.muted = false
      setMuted(false)
    }
  }

  const handleFullscreen = () => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      el.requestFullscreen()
    }
  }

  const handleQualityChange = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level
      setCurrentLevel(level)
    }
  }

  const handleRetry = () => {
    initStream()
  }

  return (
    <div ref={containerRef} className="player-wrapper rounded-lg overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="w-full h-full"
        poster={poster || undefined}
        playsInline
        preload="auto"
      />

      {/* Ad overlay during pre-roll */}
      {playerState === 'PRE_ROLL' && (
        <AdOverlay
          adUrl={adUrl}
          adDuration={30}
          minPlaySeconds={5}
          onSkip={startStream}
          onComplete={startStream}
        />
      )}

      {/* Loading state */}
      {playerState === 'LOADING' && (
        <div className="absolute inset-0 flex items-center justify-center bg-base-300/80">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}

      {/* Buffering state */}
      {playerState === 'BUFFERING' && playing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <span className="loading loading-spinner loading-md text-white"></span>
        </div>
      )}

      {/* Error state */}
      {playerState === 'ERROR' && (
        <StreamError message={error || undefined} onRetry={handleRetry} />
      )}

      {/* Controls - shown during PLAYING state */}
      {playerState === 'PLAYING' && (
        <PlayerControls
          playing={playing}
          muted={muted}
          volume={volume}
          qualityLevels={qualityLevels}
          currentLevel={currentLevel}
          onPlayPause={handlePlayPause}
          onMute={handleMute}
          onVolumeChange={handleVolumeChange}
          onFullscreen={handleFullscreen}
          onQualityChange={handleQualityChange}
        />
      )}

      {/* Stream title overlay */}
      {streamTitle && playerState === 'PLAYING' && (
        <div className="absolute top-4 left-4 z-10">
          <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded">
            {streamTitle}
          </span>
        </div>
      )}
    </div>
  )
}
