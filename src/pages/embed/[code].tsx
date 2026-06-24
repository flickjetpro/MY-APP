'use client'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { getEmbed } from '@/lib/api-client'
import type { EmbedResponse } from '@/lib/api-client'
import EmbedPlayer from '@/components/embed/EmbedPlayer'

export default function EmbedPage() {
  const router = useRouter()
  const { code } = router.query
  const [data, setData] = useState<EmbedResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code || typeof code !== 'string' || code.length !== 6) return
    getEmbed(code)
      .then(setData)
      .catch(err => setError(err.message))
  }, [code])

  if (error) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#111', color: '#999',
        fontFamily: 'sans-serif', fontSize: '16px'
      }}>
        {error === 'Embed not found' ? 'Invalid embed link' : 'Failed to load stream'}
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{
        width: '100vw', height: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#111'
      }}>
        <span style={{
          width: 32, height: 32, border: '3px solid #333',
          borderTopColor: '#fff', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <EmbedPlayer
      streamUrl={data.stream?.url || ''}
      userAgent={data.stream?.user_agent}
      referrer={data.stream?.referrer}
      channelName={data.channel?.name}
      adUrl="/ads/sample-ad.mp4"
    />
  )
}
