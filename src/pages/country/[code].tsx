'use client'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useChannels } from '@/hooks/useChannels'
import ChannelGrid from '@/components/channels/ChannelGrid'
import Pagination from '@/components/ui/Pagination'

export default function CountryPage() {
  const router = useRouter()
  const { code } = router.query
  const [page, setPage] = useState(1)

  const { data, loading } = useChannels({
    country: code as string,
    page,
    limit: 24
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Channels from {String(code || '').toUpperCase()}
      </h1>
      <ChannelGrid channels={data?.data || []} loading={loading} />
      {data?.pagination && (
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
