import type { Channel } from '@/lib/api-client'
import ChannelCard from './ChannelCard'
import { ChannelGridSkeleton } from '@/components/ui/Loading'

interface ChannelGridProps {
  channels: Channel[]
  loading?: boolean
}

export default function ChannelGrid({ channels, loading }: ChannelGridProps) {
  if (loading) return <ChannelGridSkeleton />

  if (channels.length === 0) {
    return (
      <div className="text-center py-16 opacity-60">
        <p className="text-lg">No channels found</p>
        <p className="text-sm mt-2">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <div className="channel-grid">
      {channels.map(channel => (
        <ChannelCard key={channel.id} channel={channel} />
      ))}
    </div>
  )
}
