import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlacementOverview, useRequirePlacement } from '../../hooks/usePlacementAdmin'
import PlacementSettingsForm from '../../components/admin/placementSettingsForm'
import type { PlacementOverviewRow } from '../../types'

const filters = [
  { key: 'waiting', label: 'Waiting for interview' },
  { key: 'all', label: 'All students' },
  { key: 'notTaken', label: 'Test not taken' },
] as const
type Filter = (typeof filters)[number]['key']

function matches(row: PlacementOverviewRow, filter: Filter) {
  if (filter === 'waiting') return row.testState === 'submitted' && !row.finalLevel
  if (filter === 'notTaken') return row.testState !== 'submitted'
  return true
}

function TestTag({ row }: { row: PlacementOverviewRow }) {
  const base = 'rounded-full px-3 py-0.5 text-xs font-medium'
  if (row.testState === 'submitted') return <span className={`${base} bg-green-100 text-green-800`}>Test done</span>
  if (row.expired) return <span className={`${base} bg-red-100 text-red-800`}>Time expired</span>
  if (row.testState === 'in_progress') return <span className={`${base} bg-blue-100 text-blue-800`}>In progress</span>
  if (row.needsTest) return <span className={`${base} bg-amber-100 text-amber-800`}>Asked to take the test</span>
  return <span className={`${base} bg-slate-200 text-slate-700`}>Not asked</span>
}

export default function AdminPlacement() {
  const overview = usePlacementOverview()
  const require = useRequirePlacement()
  const [filter, setFilter] = useState<Filter>('waiting')
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()
  const visible = overview.data?.filter(
    (r) =>
      matches(r, filter) && (r.name.toLowerCase().includes(query) || r.email.toLowerCase().includes(query)),
  )

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Placement test</h1>

        <div className="flex flex-wrap items-center gap-3">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                filter === f.key ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
          <input
            placeholder="Search by name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none sm:ml-auto"
          />
        </div>

        {overview.isLoading && <p className="text-slate-500">Loading...</p>}
        {overview.isError && <p className="text-red-600">Could not load the results.</p>}
        {require.isError && <p className="text-red-600">{require.error.message}</p>}
        {visible?.length === 0 && <p className="text-slate-500">Nobody here.</p>}

        <div className="space-y-3">
          {visible?.map((row) => (
            <div
              key={row.studentId}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-semibold text-slate-800 wrap-anywhere">{row.name}</p>
                  {row.status === 'pending' && (
                    <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-medium text-amber-800">
                      waiting for approval
                    </span>
                  )}
                  <TestTag row={row} />
                </div>
                <p className="text-sm text-slate-500 wrap-anywhere">{row.email}</p>
                {(row.writtenLevel || row.oralLevel || row.finalLevel) && (
                  <p className="text-sm text-slate-700">
                    {row.writtenLevel && <>Written: {row.writtenLevel}</>}
                    {row.oralLevel && <> · Oral: {row.oralLevel}</>}
                    {row.finalLevel && (
                      <>
                        {' '}
                        · <span className="font-semibold">Final: {row.finalLevel}</span>
                      </>
                    )}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                {row.testState === 'not_taken' && !row.needsTest && (
                  <button
                    className="text-sm font-medium text-indigo-600 hover:underline"
                    disabled={require.isPending}
                    onClick={() => require.mutate({ studentId: row.studentId, required: true })}
                  >
                    Ask for the test
                  </button>
                )}
                <Link
                  to={`/admin/placement/${row.studentId}`}
                  className="text-sm font-medium text-indigo-600 hover:underline"
                >
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PlacementSettingsForm />
    </div>
  )
}