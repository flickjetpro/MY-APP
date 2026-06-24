import { useRef, useState, useEffect, useCallback } from 'react'

interface AdOverlayProps {
  adUrl: string
  adDuration?: number
  minPlaySeconds?: number
  onSkip: () => void
  onComplete: () => void
}

export default function AdOverlay({
  adUrl,
  adDuration = 30,
  minPlaySeconds = 5,
  onSkip,
  onComplete
}: AdOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [canSkip, setCanSkip] = useState(false)
  const [timeLeft, setTimeLeft] = useState(adDuration)
  const [adEnded, setAdEnded] = useState(false)

  // Enable skip button after minPlaySeconds
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return
    const elapsed = videoRef.current.currentTime
    setTimeLeft(Math.max(0, Math.ceil(adDuration - elapsed)))
    if (elapsed >= minPlaySeconds && !canSkip) {
      setCanSkip(true)
    }
  }, [minPlaySeconds, canSkip, adDuration])

  // Handle ad end
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onEnded = () => {
      setAdEnded(true)
      setTimeout(onComplete, 300)
    }

    const onError = () => {
      // If ad fails, skip to stream
      onComplete()
    }

    video.addEventListener('ended', onEnded)
    video.addEventListener('error', onError)
    video.play().catch(() => {
      // Autoplay blocked, try muted
      video.muted = true
      video.play().catch(onComplete)
    })

    return () => {
      video.removeEventListener('ended', onEnded)
      video.removeEventListener('error', onError)
    }
  }, [onComplete])

  const handleSkip = () => {
    if (!canSkip || adEnded) return
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.src = ''
    }
    onSkip()
  }

  return (
    <div className="ad-overlay">
      <video
        ref={videoRef}
        src={adUrl}
        onTimeUpdate={handleTimeUpdate}
        playsInline
        autoPlay
        className="w-full h-full object-contain"
      />
      <div className="absolute inset-0 pointer-events-none" />
      <div className="ad-countdown">
        Ad &middot; {timeLeft}s
      </div>
      <button
        className="ad-skip-btn"
        disabled={!canSkip}
        onClick={handleSkip}
      >
        {canSkip ? 'Skip Ad →' : `Skip in ${timeLeft}s`}
      </button>
    </div>
  )
}
