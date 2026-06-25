'use client'
import { useState } from 'react'
import { useChannels } from '@/hooks/useChannels'
import FilterBar from '@/components/filters/FilterBar'
import ChannelGrid from '@/components/channels/ChannelGrid'
import Pagination from '@/components/ui/Pagination'

export default function HomePage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [country, setCountry] = useState('')
  const [page, setPage] = useState(1)

  const { data, loading, error } = useChannels({
    search: search || undefined,
    category: category || undefined,
    country: country || undefined,
    page,
    limit: 24
  })

  const handleSearch = (v: string) => {
    setSearch(v)
    setPage(1)
  }

  const handleCategory = (v: string) => {
    setCategory(v)
    setPage(1)
  }

  const handleCountry = (v: string) => {
    setCountry(v)
    setPage(1)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">TV Channels</h1>
      <FilterBar
        search={search}
        category={category}
        country={country}
        onSearchChange={handleSearch}
        onCategoryChange={handleCategory}
        onCountryChange={handleCountry}
      />
      {error ? (
        <div className="text-center py-16 text-error">
          <p className="text-lg font-semibold">Failed to load channels</p>
          <p className="text-sm mt-2 opacity-70">{error}</p>
        </div>
      ) : (
        <ChannelGrid channels={data?.data || []} loading={loading} />
      )}
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
