import { useEffect, useState } from 'react'
import SearchBar from './SearchBar'
import CategoryFilter from './CategoryFilter'
import CountryFilter from './CountryFilter'
import { getCategories, getCountries } from '@/lib/api-client'
import type { Category, Country } from '@/lib/api-client'

interface FilterBarProps {
  search: string
  category: string
  country: string
  onSearchChange: (v: string) => void
  onCategoryChange: (v: string) => void
  onCountryChange: (v: string) => void
}

export default function FilterBar({
  search, category, country,
  onSearchChange, onCategoryChange, onCountryChange
}: FilterBarProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [countries, setCountries] = useState<Country[]>([])

  useEffect(() => {
    getCategories().then(res => setCategories(res.data)).catch(() => {})
    getCountries().then(res => setCountries(res.data)).catch(() => {})
  }, [])

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <SearchBar value={search} onChange={onSearchChange} />
      <CategoryFilter categories={categories} selected={category} onChange={onCategoryChange} />
      <CountryFilter countries={countries} selected={country} onChange={onCountryChange} />
    </div>
  )
}
