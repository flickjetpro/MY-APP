import Link from 'next/link'
import type { Channel } from '@/lib/api-client'

interface ChannelCardProps {
  channel: Channel
}

export default function ChannelCard({ channel }: ChannelCardProps) {
  const sportsRelated = channel.categories?.includes('sports')

  return (
    <Link href={`/watch/${channel.id}`}>
      <div className={`channel-card card bg-base-200 shadow-md hover:shadow-xl ${sportsRelated ? 'ring-2 ring-accent' : ''}`}>
        <div className="card-body items-center text-center p-4">
          <div className="w-16 h-16 rounded-full bg-base-300 flex items-center justify-center overflow-hidden mb-2">
            {channel.logo_url ? (
              <img
                src={channel.logo_url}
                alt={channel.name}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            ) : (
              <span className="text-2xl font-bold opacity-30">
                {channel.name.charAt(0)}
              </span>
            )}
          </div>
          <h3 className="card-title text-sm font-semibold line-clamp-2">
            {channel.name}
          </h3>
          {channel.country_code && (
            <span className="text-xs opacity-60">
              {channel.country_code}
            </span>
          )}
          {sportsRelated && (
            <div className="badge badge-accent badge-sm mt-1">Sports</div>
          )}
        </div>
      </div>
    </Link>
  )
}
