'use client'
import { useRouter } from 'next/router'
import { useChannel } from '@/hooks/useChannels'
import MediaPlayer from '@/components/media/MediaPlayer'
import Loading from '@/components/ui/Loading'

export default function WatchPage() {
  const router = useRouter()
  const { id } = router.query
  const { data: channel, loading, error } = useChannel(id as string)

  if (loading) return <Loading />
  if (error || !channel) {
    return (
      <div className="text-center py-16">
        <p className="text-lg opacity-60">Channel not found</p>
        <button className="btn btn-primary btn-sm mt-4" onClick={() => router.push('/')}>
          Back to channels
        </button>
      </div>
    )
  }

  // Get the best quality active stream
  const activeStream = channel.streams?.find(s => s.is_active) || channel.streams?.[0]

  return (
    <div className="max-w-5xl mx-auto">
      {/* Player */}
      {activeStream ? (
        <MediaPlayer
          streamUrl={activeStream.url}
          streamTitle={`${channel.name}${activeStream.quality ? ` (${activeStream.quality})` : ''}`}
          referrer={activeStream.referrer}
          user_agent={activeStream.user_agent}
          poster={channel.logo_url || undefined}
          adUrl="/ads/sample-ad.mp4"
          autoPlay
        />
      ) : (
        <div className="player-wrapper rounded-lg overflow-hidden bg-base-300 flex items-center justify-center">
          <p className="text-lg opacity-60">No active streams available</p>
        </div>
      )}

      {/* Channel Info */}
      <div className="mt-6">
        <div className="flex items-start gap-4">
          {channel.logo_url && (
            <img src={channel.logo_url} alt={channel.name} className="w-16 h-16 rounded-lg object-contain bg-base-200" />
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{channel.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              {channel.country_code && (
                <span className="badge badge-outline">{channel.country_code}</span>
              )}
              {channel.categories?.map(cat => (
                <span key={cat} className="badge badge-accent badge-sm">{cat}</span>
              ))}
              {channel.streams?.map(s => s.quality).filter(Boolean).map(q => (
                <span key={q} className="badge badge-ghost badge-sm">{q}</span>
              ))}
            </div>
            {channel.website && (
              <a href={channel.website} target="_blank" rel="noopener noreferrer"
                className="link link-primary text-sm mt-2 inline-block">
                Official Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stream quality selector */}
      {channel.streams && channel.streams.length > 1 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2 opacity-70">Available Streams</h3>
          <div className="flex flex-wrap gap-2">
            {channel.streams.map(s => (
              <div key={s.id}
                className={`px-3 py-1.5 rounded text-sm border cursor-pointer transition
                  ${s.is_active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-base-300 opacity-50'}`}
              >
                {s.quality || s.title}
                {s.label && <span className="text-xs opacity-60 ml-1">({s.label})</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
