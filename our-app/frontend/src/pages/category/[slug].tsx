'use client'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useChannels } from '@/hooks/useChannels'
import ChannelGrid from '@/components/channels/ChannelGrid'
import Pagination from '@/components/ui/Pagination'

export default function CategoryPage() {
  const router = useRouter()
  const { slug } = router.query
  const [page, setPage] = useState(1)

  const { data, loading } = useChannels({
    category: slug as string,
    page,
    limit: 24
  })

  const categoryName = slug ? String(slug).charAt(0).toUpperCase() + String(slug).slice(1) : ''

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">{categoryName} Channels</h1>
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
