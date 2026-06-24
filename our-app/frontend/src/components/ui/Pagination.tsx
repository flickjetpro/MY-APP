interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: number[] = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        className="btn btn-sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </button>

      {start > 1 && (
        <>
          <button className="btn btn-sm btn-ghost" onClick={() => onPageChange(1)}>1</button>
          {start > 2 && <span className="text-sm opacity-50">...</span>}
        </>
      )}

      {pages.map(p => (
        <button
          key={p}
          className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-sm opacity-50">...</span>}
          <button className="btn btn-sm btn-ghost" onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </button>
        </>
      )}

      <button
        className="btn btn-sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  )
}
