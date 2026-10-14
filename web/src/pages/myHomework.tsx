import { useState } from 'react'
import { useMyHomeworkList } from '../hooks/useMyHomeworkList'
import AssignmentCard from '../components/assignmentCard'

const filters = ['all', 'pending', 'submitted', 'graded'] as const
type Filter = (typeof filters)[number]

export default function MyHomework() {
  const homework = useMyHomeworkList()
  const [filter, setFilter] = useState<Filter>('all')

  const visible = homework.data?.filter((a) => filter === 'all' || a.status === filter)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">My homework</h1>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {homework.isLoading && <p className="text-slate-500">Loading homework...</p>}
      {homework.isError && <p className="text-red-600">Could not load homework.</p>}
      {visible?.length === 0 && <p className="text-slate-500">Nothing here.</p>}

      <div className="space-y-3">
        {visible?.map((a) => (
          <AssignmentCard key={a.id} assignment={a} />
        ))}
      </div>
    </div>
  )
}