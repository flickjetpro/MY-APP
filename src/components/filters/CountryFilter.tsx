import type { Country } from '@/lib/api-client'

interface CountryFilterProps {
  countries: Country[]
  selected: string
  onChange: (country: string) => void
}

export default function CountryFilter({ countries, selected, onChange }: CountryFilterProps) {
  return (
    <select
      className="select select-bordered select-sm"
      value={selected}
      onChange={e => onChange(e.target.value)}
    >
      <option value="">All Countries</option>
      {countries.map(c => (
        <option key={c.code} value={c.code}>
          {c.flag ? `${c.flag} ` : ''}{c.name}
        </option>
      ))}
    </select>
  )
}
