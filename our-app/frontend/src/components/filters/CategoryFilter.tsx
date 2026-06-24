import type { Category } from '@/lib/api-client'

interface CategoryFilterProps {
  categories: Category[]
  selected: string
  onChange: (category: string) => void
}

export default function CategoryFilter({ categories, selected, onChange }: CategoryFilterProps) {
  return (
    <select
      className="select select-bordered select-sm"
      value={selected}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">All Categories</option>
      {categories.map(cat => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
        </option>
      ))}
    </select>
  )
}
