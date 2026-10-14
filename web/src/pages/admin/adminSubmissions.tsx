import { useState } from 'react'
import { useSubmissionList } from '../../hooks/useSubmissionList'
import { useStudentList } from '../../hooks/useStudentList'
import StatusBadge from '../../components/statusBadge'
import GradePanel from '../../components/admin/gradePanel'

const filters = [
  { key: 'toGrade', label: 'To grade' },
  { key: 'graded', label: 'Graded' },
  { key: 'all', label: 'All' },
] as const
type Filter = (typeof filters)[number]['key']

export default function AdminSubmissions() {
  const submissions = useSubmissionList()
  const students = useStudentList()

  const [filter, setFilter] = useState<Filter>('toGrade')
  const [openId, setOpenId] = useState<number | null>(null)

  const nameOf = (studentId: number) =>
    students.data?.find((s) => s.id === studentId)?.name ?? 'Unknown student'

  const visible = submissions.data?.filter((r) =>
    filter === 'all' ? true : filter === 'toGrade' ? r.status === 'submitted' : r.status === 'graded',
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Submissions</h1>

      <div className="flex flex-wrap gap-2">
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
      </div>

      {submissions.isLoading && <p className="text-slate-500">Loading submissions...</p>}
      {submissions.isError && <p className="text-red-600">Could not load submissions.</p>}
      {visible?.length === 0 && <p className="text-slate-500">Nothing here.</p>}

      <div className="space-y-3">
        {visible?.map((row) => (
          <div key={row.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-800">{row.title}</p>
                <p className="text-sm text-slate-500">
                  {nameOf(row.studentId)} · sent{' '}
                  {row.submittedAt ? new Date(row.submittedAt).toLocaleString() : ''}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {row.grade !== undefined && (
                  <span className="font-bold text-slate-800">{row.grade}/10</span>
                )}
                <StatusBadge status={row.status} />
                <button
                  className="text-sm font-medium text-indigo-600 hover:underline"
                  onClick={() => setOpenId(openId === row.id ? null : row.id)}
                >
                  {row.status === 'graded' ? 'View / edit' : 'Grade'}
                </button>
              </div>
            </div>

            {openId === row.id && <GradePanel row={row} onDone={() => setOpenId(null)} />}
          </div>
        ))}
      </div>
    </div>
  )
}