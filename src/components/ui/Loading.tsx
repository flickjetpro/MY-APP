export default function Loading() {
  return (
    <div className="flex items-center justify-center p-12">
      <span className="loading loading-spinner loading-lg text-primary"></span>
    </div>
  )
}

export function ChannelCardSkeleton() {
  return (
    <div className="card bg-base-200 shadow animate-pulse">
      <div className="card-body items-center p-4">
        <div className="w-16 h-16 bg-base-300 rounded-full mb-3"></div>
        <div className="h-4 bg-base-300 rounded w-24 mb-2"></div>
        <div className="h-3 bg-base-300 rounded w-16"></div>
      </div>
    </div>
  )
}

export function ChannelGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="channel-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ChannelCardSkeleton key={i} />
      ))}
    </div>
  )
}
